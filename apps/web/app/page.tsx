import UnAuthHeader from "@/components/headers/unAuthHeader";
import { createServer } from "@repo/supabase/server";
import DashboardLayout from "./(dashboard)/layout";
import Dashboard from "./(dashboard)/page";
import { Suspense } from "react";

export async function LandingPage() {
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

  return (
    <>
      <UnAuthHeader />

      <main className="grid place-content-center h-[200svh]">
        <h1>Home</h1>
      </main>
    </>
  );
}

export default function Home() {
  return(
    <Suspense fallback={(<h1>Loading...</h1>)}>
      <LandingPage />
    </Suspense>
  )
}
