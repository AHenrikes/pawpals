import { createBrowserClient } from "@supabase/ssr";

export function createClient(actingFursonaId?: string | null) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    actingFursonaId
      ? { global: { headers: { "x-acting-fursona-id": actingFursonaId } } }
      : undefined,
  );
}
