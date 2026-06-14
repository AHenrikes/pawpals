import type { Metadata } from "next";
import Header from "@/components/navigation/Header";
import MainNav from "@/components/navigation/MainNav";
import { SidebarInset, SidebarProvider } from "@/providers/SidebarProvider";
import { UserProvider } from "@/providers/UserProvider";
import { requireUser } from "@/lib/auth/requireUser";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireUser();

  if (!user) {
    redirect(AUTH_ROUTES.SIGN_IN);
  }

  return (
    <div id="DashboardLayout">
      <UserProvider>
        <SidebarProvider className="flex flex-col">
          <Header />

          <SidebarInset>
            <MainNav />

            <div className="w-full">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </UserProvider>
    </div>
  );
}
