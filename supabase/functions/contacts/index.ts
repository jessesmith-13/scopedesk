import { Hono } from 'hono'
import type { MiddlewareHandler, Context, Next } from 'hono'
import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { authMiddleware } from '../_shared/middleware/auth.ts'

type ContactRow = {
  id: string
  user_id: string
  lead_id: string | null
  full_name: string
  role: string | null
  email: string | null
  phone: string | null
  preferred_method: string | null
  is_primary: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

const app = new Hono().basePath('/contacts')

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

// List contacts — optionally filtered by lead_id
app.get('/', async (c: Context) => {
  try {
    const { userId } = c.get('auth')
    const leadId = c.req.query('lead_id')
    const supabase = createSupabaseAdmin()

    let query = supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('full_name', { ascending: true })

    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching contacts:', error)
      return c.json(
        { error: 'Failed to fetch contacts', details: error.message },
        500
      )
    }

    return c.json({ data })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Unexpected error in GET /contacts:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get single contact
app.get('/:id', async (c: Context) => {
  try {
    const { userId } = c.get('auth')
    const contactId = c.req.param('id')
    const supabase = createSupabaseAdmin()

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching contact:', error)
      return c.json({ error: 'Contact not found', details: error.message }, 404)
    }

    return c.json({ data })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Unexpected error in GET /contacts/:id:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Create contact — enforces single primary per lead
app.post('/', async (c: Context) => {
  try {
    const { userId } = c.get('auth')
    const body = (await c.req.json()) as Partial<ContactRow>
    const supabase = createSupabaseAdmin()

    // If marking as primary, clear existing primary for this lead
    if (body.is_primary && body.lead_id) {
      await supabase
        .from('contacts')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .eq('lead_id', body.lead_id)
        .eq('is_primary', true)
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({ ...body, user_id: userId })
      .select()
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return c.json(
        { error: 'Failed to create contact', details: error.message },
        500
      )
    }

    return c.json({ data }, 201)
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Unexpected error in POST /contacts:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update contact — enforces single primary per lead
app.put('/:id', async (c: Context) => {
  try {
    const { userId } = c.get('auth')
    const contactId = c.req.param('id')
    const body = (await c.req.json()) as Partial<ContactRow>
    const supabase = createSupabaseAdmin()

    // If marking as primary, clear existing primary for this lead
    if (body.is_primary) {
      // Find the contact to get its lead_id
      const { data: existing } = await supabase
        .from('contacts')
        .select('lead_id')
        .eq('id', contactId)
        .eq('user_id', userId)
        .single()

      const leadId = body.lead_id ?? existing?.lead_id
      if (leadId) {
        await supabase
          .from('contacts')
          .update({ is_primary: false })
          .eq('user_id', userId)
          .eq('lead_id', leadId)
          .eq('is_primary', true)
          .neq('id', contactId)
      }
    }

    const { data, error } = await supabase
      .from('contacts')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', contactId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating contact:', error)
      return c.json(
        { error: 'Failed to update contact', details: error.message },
        500
      )
    }

    return c.json({ data })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Unexpected error in PUT /contacts/:id:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Delete contact
app.delete('/:id', async (c: Context) => {
  try {
    const { userId } = c.get('auth')
    const contactId = c.req.param('id')
    const supabase = createSupabaseAdmin()

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting contact:', error)
      return c.json(
        { error: 'Failed to delete contact', details: error.message },
        500
      )
    }

    return c.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Unexpected error in DELETE /contacts/:id:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

Deno.serve(async (req: Request) => {
  try {
    return await app.fetch(req)
  } catch (error) {
    console.error('Top-level error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
