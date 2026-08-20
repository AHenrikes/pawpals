import { SidebarInset, SidebarProvider } from "@/providers/SidebarProvider";
import { UserProvider } from "@/providers/UserProvider";
import { type Metadata } from "next";
import Header from "@/components/navigation/Header";
import MainNav from "@/components/navigation/Aside";
import { HomeTabsProvider } from "@/providers/HomeTabsProvider";
import { requireUser } from "@/lib/auth/requireUser";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { account } = await requireUser();
  if (!account) redirect(AUTH_ROUTES.SIGN_IN);

  return (
    <div id="DashboardLayout">
      <UserProvider>
        <HomeTabsProvider>
          <SidebarProvider className="flex flex-col">
            <Header />
            <SidebarInset>
              <MainNav />
              {children}
            </SidebarInset>
          </SidebarProvider>
        </HomeTabsProvider>
      </UserProvider>
    </div>
  );
}
