import { createServer } from "@repo/supabase/server";
import LandingPage from "./LandingPage";
import Dashboard from "./(dashboard)/page";
import DashboardLayout from "./(dashboard)/layout";

export default async function Home() {
  const supabase = await createServer();
  const { data } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  if (session) {
    return (
      <DashboardLayout>
        <Dashboard />
      </DashboardLayout>
    );
  }

  return <LandingPage />;
}
