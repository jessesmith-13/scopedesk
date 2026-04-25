import { Hono } from 'hono'
import type { MiddlewareHandler, Context, Next } from 'hono'
import type {
  Database,
  DealStage,
  Json,
  ActivityType,
} from '../_shared/types.ts'
import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { authMiddleware } from '../_shared/middleware/auth.ts'

type DealRow = Database['public']['Tables']['deals']['Row']
type DealInsert = Database['public']['Tables']['deals']['Insert']
type DealUpdate = Database['public']['Tables']['deals']['Update']

type ActivityInsert = Database['public']['Tables']['activities']['Insert']

const app = new Hono().basePath('/deals')

// Preflight
app.options(
  '*',
  () => new Response(null, { status: 204, headers: corsHeaders })
)

const applyCors: MiddlewareHandler = async (c: Context, next: Next) => {
  if (c.req.method === 'OPTIONS') {
    return c.newResponse(null, 204, corsHeaders)
  }
  await next()
  for (const [k, v] of Object.entries(corsHeaders)) c.res.headers.set(k, v)
}
app.use('*', applyCors, authMiddleware)

function getStageProbability(stage: DealStage): number {
  const probabilities: Record<DealStage, number> = {
    qualified: 20,
    meeting_scheduled: 35,
    proposal_sent: 60,
    negotiation: 75,
    won: 100,
    lost: 0,
  }
  return probabilities[stage]
}

function jsonError(message: string, status = 400, details?: unknown) {
  return new Response(JSON.stringify({ error: message, details }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * GET /
 * List deals for the authed user. Optional stage filter.
 */
app.get('/', async (c: Context) => {
  try {
    const { userId } = c.get('auth')
    const supabase = createSupabaseAdmin()

    const stage = c.req.query('stage') as DealStage | undefined

    let q = supabase
      .from('deals')
      .select(
        `
        *,
        lead:leads(
          id,
          business_name,
          category,
          neighborhood,
          phone,
          website_url,
          website_status,
          outreach_status
        ),
        contact:contacts!deals_primary_contact_id_fkey(
          id,
          full_name,
          email,
          phone,
          role,
          is_primary
        )
      `
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (stage) q = q.eq('stage', stage)

    const { data, error } = await q
    if (error) return jsonError(error.message, 500)

    return c.json(data ?? [])
  } catch (err) {
    // requireAuth throws Response on 401
    if (err instanceof Response) return err
    console.error('GET /deals error:', err)
    return jsonError('Internal server error', 500)
  }
})

/**
 * GET /:id
 * Fetch one deal (scoped to authed user)
 */
app.get('/:id', async (c) => {
  try {
    const { userId } = c.get('auth')
    const supabase = createSupabaseAdmin()
    const id = c.req.param('id')

    const { data, error } = await supabase
      .from('deals')
      .select(
        `
        *,
        lead:leads(*),
        contact:contacts!deals_primary_contact_id_fkey(*)
      `
      )
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      const status = error.code === 'PGRST116' ? 404 : 500
      return jsonError(error.message, status)
    }

    return c.json(data)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('GET /deals/:id error:', err)
    return jsonError('Internal server error', 500)
  }
})

type CreateDealBody = {
  lead_id: string
  primary_contact_id?: string | null
  stage?: DealStage
  deal_value?: number | null
  probability?: number
  expected_close_date?: string | null
  service_type?: string | null
  title?: string | null
  next_follow_up_at?: string | null
}

/**
 * POST /
 * Create deal (usually "converted from lead")
 */
app.post('/', async (c) => {
  try {
    const { userId } = c.get('auth')
    const supabase = createSupabaseAdmin()

    const body = await c.req.json<CreateDealBody>()

    if (!body.lead_id) return jsonError('lead_id is required', 400)

    const stage: DealStage = body.stage ?? 'qualified'
    const probability = body.probability ?? getStageProbability(stage)

    const insertData: DealInsert = {
      user_id: userId,
      lead_id: body.lead_id,
      primary_contact_id: body.primary_contact_id ?? null,
      stage,
      deal_value: body.deal_value ?? null,
      probability,
      expected_close_date: body.expected_close_date ?? null,
      service_type: body.service_type ?? null,
      title: body.title ?? null,
      next_follow_up_at: body.next_follow_up_at ?? null,
    }

    // Create the deal
    const { data: deal, error } = await supabase
      .from('deals')
      .insert(insertData)
      .select()
      .single()

    if (error) return jsonError(error.message, 500)

    const dealRow = deal as Pick<DealRow, 'id' | 'lead_id' | 'stage'>

    // Log activity
    const activity: ActivityInsert = {
      user_id: userId,
      deal_id: dealRow.id,
      lead_id: dealRow.lead_id,
      type: 'note' satisfies ActivityType,
      subject: 'Deal created',
      body: `Deal created in stage: ${stage}`,
      meta: { stage } as unknown as Json,
    }

    await supabase.from('activities').insert(activity)

    // Update lead outreach_status to "converted_to_deal" when a deal is created
    if (body.lead_id) {
      await supabase
        .from('leads')
        .update({ outreach_status: 'converted_to_deal' })
        .eq('id', body.lead_id)
        .eq('user_id', userId)
    }

    return c.json(deal, 201)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('POST /deals error:', err)
    return jsonError('Internal server error', 500)
  }
})

type UpdateDealBody = {
  primary_contact_id?: string | null
  stage?: DealStage
  deal_value?: number | null
  probability?: number
  expected_close_date?: string | null
  service_type?: string | null
  title?: string | null
  next_follow_up_at?: string | null
  lost_reason?: string | null
}

/**
 * PATCH /:id
 * Update deal
 */
app.patch('/:id', async (c) => {
  try {
    const { userId } = c.get('auth')
    const supabase = createSupabaseAdmin()
    const id = c.req.param('id')
    const body = await c.req.json<UpdateDealBody>()

    // Load current for stage-change logging
    const { data: current, error: currentErr } = await supabase
      .from('deals')
      .select('id, user_id, stage, lead_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (currentErr) {
      const status = currentErr.code === 'PGRST116' ? 404 : 500
      return jsonError(currentErr.message, status)
    }

    const update: DealUpdate = {
      primary_contact_id: body.primary_contact_id,
      stage: body.stage,
      deal_value: body.deal_value,
      expected_close_date: body.expected_close_date,
      service_type: body.service_type,
      title: body.title,
      next_follow_up_at: body.next_follow_up_at,
      lost_reason: body.lost_reason,
      updated_at: new Date().toISOString(),
    }

    // If stage changed and probability not set, auto-set it
    if (body.stage && body.probability === undefined) {
      update.probability = getStageProbability(body.stage)
    } else if (body.probability !== undefined) {
      update.probability = body.probability
    }

    // Auto stamp won/lost
    if (body.stage === 'won') update.won_at = new Date().toISOString()
    if (body.stage === 'lost') update.lost_at = new Date().toISOString()

    const { data: updated, error } = await supabase
      .from('deals')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return jsonError(error.message, 500)

    // Activity log if stage changed
    if (body.stage && body.stage !== current.stage) {
      const activity: ActivityInsert = {
        user_id: userId,
        deal_id: id,
        lead_id: current.lead_id,
        type: 'note' satisfies ActivityType,
        subject: 'Stage changed',
        body: `Deal moved from ${current.stage} → ${body.stage}`,
        meta: {
          old_stage: current.stage,
          new_stage: body.stage,
        } as unknown as Json,
      }
      await supabase.from('activities').insert(activity)
    }

    return c.json(updated)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('PATCH /deals/:id error:', err)
    return jsonError('Internal server error', 500)
  }
})

/**
 * DELETE /:id
 */
app.delete('/:id', async (c) => {
  try {
    const { userId } = c.get('auth')
    const supabase = createSupabaseAdmin()
    const id = c.req.param('id')

    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) return jsonError(error.message, 500)

    return c.json({ success: true })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('DELETE /deals/:id error:', err)
    return jsonError('Internal server error', 500)
  }
})

Deno.serve(app.fetch)
