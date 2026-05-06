import { Hono } from 'hono'
import type { MiddlewareHandler, Context, Next } from 'hono'
import type { Database, ProposalStatus, Json } from '../_shared/types.ts'
import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { authMiddleware } from '../_shared/middleware/auth.ts'

type ProposalInsert = Database['public']['Tables']['proposals']['Insert']
type ProposalUpdate = Database['public']['Tables']['proposals']['Update']

const app = new Hono().basePath('/proposals')

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

function jsonError(message: string, status = 400, details?: unknown) {
  return new Response(JSON.stringify({ error: message, details }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * GET /
 * List proposals for the authed user. Optional deal_id filter.
 */
app.get('/', async (c: Context) => {
  try {
    const { userId } = c.get('auth')
    const supabase = createSupabaseAdmin()

    const dealId = c.req.query('deal_id')

    let q = supabase
      .from('proposals')
      .select(
        `
        *,
        deal:deals(
          title,
          lead:leads(business_name)
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (dealId) q = q.eq('deal_id', dealId)

    const { data, error } = await q

    if (error) {
      console.error('Error fetching proposals:', error)
      return jsonError(error.message, 500)
    }

    return c.json(data ?? [])
  } catch (err) {
    if (err instanceof Response) return err
    console.error('GET /proposals error:', err)
    return jsonError('Internal server error', 500)
  }
})

/**
 * GET /:id
 * Fetch one proposal (scoped to authed user)
 */
app.get('/:id', async (c) => {
  try {
    const { userId } = c.get('auth')
    const supabase = createSupabaseAdmin()
    const id = c.req.param('id')

    const { data, error } = await supabase
      .from('proposals')
      .select(
        `
        *,
        deal:deals(
          title,
          lead:leads(business_name)
        )
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
    console.error('GET /proposals/:id error:', err)
    return jsonError('Internal server error', 500)
  }
})

type CreateProposalBody = {
  deal_id: string
  title: string
  status?: ProposalStatus
  currency?: string
  subtotal: number
  tax?: number
  total: number
  content?: Json | null
  expires_at?: string | null
}

/**
 * POST /
 * Create proposal
 */
app.post('/', async (c) => {
  try {
    const { userId } = c.get('auth')
    const supabase = createSupabaseAdmin()

    const body = await c.req.json<CreateProposalBody>()

    if (!body.deal_id) return jsonError('deal_id is required', 400)
    if (!body.title) return jsonError('title is required', 400)
    if (body.total === undefined) return jsonError('total is required', 400)
    if (body.subtotal === undefined)
      return jsonError('subtotal is required', 400)

    const insertData: ProposalInsert = {
      user_id: userId,
      deal_id: body.deal_id,
      status: body.status ?? 'draft',
      title: body.title,
      currency: body.currency ?? 'USD',
      subtotal: body.subtotal,
      tax: body.tax ?? 0,
      total: body.total,
      content: body.content ?? null,
      expires_at: body.expires_at ?? null,
    }

    const { data: proposal, error } = await supabase
      .from('proposals')
      .insert(insertData)
      .select()
      .single()

    if (error) return jsonError(error.message, 500)

    return c.json(proposal, 201)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('POST /proposals error:', err)
    return jsonError('Internal server error', 500)
  }
})

type UpdateProposalBody = {
  title?: string
  status?: ProposalStatus
  content?: Json | null
  subtotal?: number
  tax?: number
  total?: number
  sent_to?: string | null
  expires_at?: string | null
}

/**
 * PATCH /:id
 * Update proposal
 */
app.patch('/:id', async (c) => {
  try {
    const { userId } = c.get('auth')
    const supabase = createSupabaseAdmin()
    const id = c.req.param('id')
    const body = await c.req.json<UpdateProposalBody>()

    const update: ProposalUpdate = {
      title: body.title,
      status: body.status,
      content: body.content,
      subtotal: body.subtotal,
      tax: body.tax,
      total: body.total,
      sent_to: body.sent_to,
      expires_at: body.expires_at,
      updated_at: new Date().toISOString(),
    }

    // Auto-stamp timestamps for status changes
    if (body.status === 'sent' && !update.sent_at) {
      update.sent_at = new Date().toISOString()
    }
    if (body.status === 'viewed' && !update.viewed_at) {
      update.viewed_at = new Date().toISOString()
    }
    if (body.status === 'signed' && !update.signed_at) {
      update.signed_at = new Date().toISOString()
    }

    const { data: updated, error } = await supabase
      .from('proposals')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return jsonError(error.message, 500)

    return c.json(updated)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('PATCH /proposals/:id error:', err)
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
      .from('proposals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) return jsonError(error.message, 500)

    return c.json({ success: true })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('DELETE /proposals/:id error:', err)
    return jsonError('Internal server error', 500)
  }
})

Deno.serve(app.fetch)
