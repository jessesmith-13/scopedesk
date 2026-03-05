import { createClient } from "npm:@supabase/supabase-js@2";

export type AuthContext = { userId: string; email?: string };

const getBearer = (authHeader: string | null) => {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
};

export async function requireAuth(authHeader: string | null): Promise<AuthContext> {
  const token = getBearer(authHeader);
  if (!token) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // IMPORTANT: use ANON key for auth verification
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: "Unauthorized", details: error?.message }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { userId: data.user.id, email: data.user.email ?? undefined };
}