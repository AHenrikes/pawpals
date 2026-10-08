import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using it.
 */
export async function createServer() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const actingFursonaId = requestHeaders.get("x-acting-fursona-id");

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      global: actingFursonaId
        ? { headers: { "x-acting-fursona-id": actingFursonaId } }
        : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing user sessions.
          }
        },
      },
    },
  );
}
