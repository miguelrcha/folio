import { createClient } from "@supabase/supabase-js";

// Cliente com a service role key: ignora RLS. Só pra uso em contextos sem
// sessão de usuário (ex: o cron job de sync em lote), nunca em rotas que
// respondem a um visitante.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
