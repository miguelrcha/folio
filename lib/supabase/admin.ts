import { createClient } from "@supabase/supabase-js";

// Client with the service role key: bypasses RLS. Only for use in
// contexts without a user session (e.g. the batch sync cron job), never in
// routes that respond to a visitor.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
