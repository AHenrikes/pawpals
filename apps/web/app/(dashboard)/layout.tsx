import type { Metadata } from "next";
import MainNav from "@/components/navigation/MainNav";
import { SidebarInset, SidebarProvider } from "@/providers/SidebarProvider";
import { UserProvider } from "@/providers/UserProvider";
import { ProfileProvider } from "@/providers/ProfileProvider";
import Header from "@/components/navigation/Header";
import { createServer } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/auth/routes";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(AUTH_ROUTES.SIGN_IN);
  }

  return (
    <div id="DashboardLayout">
      <UserProvider>
        <ProfileProvider>
          <SidebarProvider>
            <MainNav />

            <div className="flex w-svw h-svh">
              <Header />

              <SidebarInset className="overflow-y-auto pt-16">
                {children}
              </SidebarInset>
            </div>
          </SidebarProvider>
        </ProfileProvider>
      </UserProvider>
    </div>
  );
}
