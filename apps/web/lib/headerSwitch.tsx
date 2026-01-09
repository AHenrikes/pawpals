import { createServer } from "@repo/supabase/server";
import { Header, AuthHeader } from "@/components/Header";

export default async function ServerHeader() {
  const supabase = await createServer();
  const { data } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  return session ? <AuthHeader /> : <Header />;
}
