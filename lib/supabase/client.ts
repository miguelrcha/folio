import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton: evita criar múltiplas instâncias do GoTrueClient na mesma aba.
// Ter várias instâncias competindo pelo mesmo localStorage causa sessão
// detectada de forma inconsistente entre componentes (ex: header sem contar
// perfil, telas que ficam esperando uma resposta que nunca chega).
let browserClient: SupabaseClient | undefined;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}