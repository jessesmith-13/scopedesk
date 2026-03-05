// Leads CRUD edge function
import { Hono } from "npm:hono@4";
import type { Context } from "npm:hono@4";
import { createSupabaseAdmin } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth.ts";
import type { MiddlewareHandler, Context as HonoContext, Next } from "npm:hono@4";
import type { Database } from "../_shared/types.ts";
import { computeDedupeKey } from "../_shared/dedupe.ts";
import { corsHeaders } from "../_shared/cors.ts";

type LeadInsert = Database['public']['Tables']['leads']['Insert'];

const app = new Hono().basePath('/leads');

// ✅ Preflight
app.options("*", () => new Response(null, { status: 204, headers: corsHeaders }));

const applyCors: MiddlewareHandler = async (c: HonoContext, next: Next) => {
  if (c.req.method === "OPTIONS") {
    return c.newResponse(null, 204, corsHeaders);
  }
  await next();
  for (const [k, v] of Object.entries(corsHeaders)) c.res.headers.set(k, v);
};
app.use("*", applyCors);

// List all leads for authenticated user
app.get("/", async (c: Context) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { userId } = await requireAuth(authHeader);
    
    const supabase = createSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching leads:', error);
      return c.json({ error: 'Failed to fetch leads', details: error.message }, 500);
    }
    
    return c.json({ data });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Unexpected error in GET /leads:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create new lead
app.post("/", async (c: Context) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { userId } = await requireAuth(authHeader);
    
    const body = await c.req.json();
    const supabase = createSupabaseAdmin();
    
    // Check if this is bulk import
    if (body && typeof body === 'object' && 'leads' in body && Array.isArray(body.leads)) {
      // Compute dedupe_key for each lead
      const leadsWithDedupeKey: LeadInsert[] = body.leads.map((lead: LeadInsert) => {
        const dedupeKey = computeDedupeKey({
          business_name: lead.business_name,
          address_line1: lead.address_line1,
          postal_code: lead.postal_code,
          lat: lead.lat,
          lng: lead.lng,
        });
        
        return {
          ...lead,
          user_id: userId,
          dedupe_key: dedupeKey,
        };
      });
      
      // Use upsert to handle duplicates gracefully
      // onConflict with ignoreDuplicates will skip duplicates
      const { data, error } = await supabase
        .from('leads')
        .upsert(leadsWithDedupeKey, {
          onConflict: 'user_id,dedupe_key',
          ignoreDuplicates: true,
        })
        .select();
      
      if (error) {
        console.error('Error bulk creating leads:', error);
        return c.json({ error: 'Failed to create leads', details: error.message }, 500);
      }
      
      const insertedCount = data?.length || 0;
      const skippedCount = leadsWithDedupeKey.length - insertedCount;
      
      return c.json({ 
        data, 
        inserted: insertedCount,
        skipped_duplicates: skippedCount,
        total: leadsWithDedupeKey.length 
      }, 201);
    }
    
    // Single lead creation - body is the lead itself
    const leadData = body as Omit<LeadInsert, 'user_id' | 'dedupe_key'>;
    
    const dedupeKey = computeDedupeKey({
      business_name: leadData.business_name,
      address_line1: leadData.address_line1,
      postal_code: leadData.postal_code,
      lat: leadData.lat,
      lng: leadData.lng,
    });
    
    const leadToInsert: LeadInsert = {
      ...leadData,
      user_id: userId,
      dedupe_key: dedupeKey,
    };
    
    const { data, error } = await supabase
      .from('leads')
      .insert(leadToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating lead:', error);
      return c.json({ error: 'Failed to create lead', details: error.message }, 500);
    }
    
    return c.json({ data }, 201);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Unexpected error in POST /leads:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get single lead by ID
app.get("/:id", async (c: Context) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { userId } = await requireAuth(authHeader);
    
    const leadId = c.req.param('id');
    const supabase = createSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching lead:', error);
      return c.json({ error: 'Lead not found', details: error.message }, 404);
    }
    
    return c.json({ data });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Unexpected error in GET /leads/:id:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update lead
app.put("/:id", async (c: Context) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { userId } = await requireAuth(authHeader);
    
    const leadId = c.req.param('id');
    const body = await c.req.json() as Partial<LeadInsert>;
    const supabase = createSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('leads')
      .update(body)
      .eq('id', leadId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating lead:', error);
      return c.json({ error: 'Failed to update lead', details: error.message }, 500);
    }
    
    return c.json({ data });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Unexpected error in PUT /leads/:id:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete lead
app.delete("/:id", async (c: Context) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { userId } = await requireAuth(authHeader);
    
    const leadId = c.req.param('id');
    const supabase = createSupabaseAdmin();
    
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting lead:', error);
      return c.json({ error: 'Failed to delete lead', details: error.message }, 500);
    }
    
    return c.json({ success: true });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Unexpected error in DELETE /leads/:id:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(async (req: Request) => {
  try {
    return await app.fetch(req);
  } catch (error) {
    console.error('Top-level error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});