import PublicShell from "@/components/layouts/PublicShell";
import { createServer } from "@repo/supabase/server";
import DashboardLayout from "./(dashboard)/layout";
import Dashboard from "./(dashboard)/page";
import { Suspense } from "react";
import Loading from "./loading";

export async function LandingPage() {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <DashboardLayout>
        <Dashboard />
      </DashboardLayout>
    );
  }

  return (
    <PublicShell>
      <main className="grid place-content-center h-[200svh]">
        <h1>Home</h1>
      </main>
    </PublicShell>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <LandingPage />
    </Suspense>
  );
}
