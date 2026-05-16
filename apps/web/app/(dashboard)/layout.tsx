import type { Metadata } from "next";
import MainNav from "@/components/asides/MainNav";
import { SidebarInset, SidebarProvider } from "@/providers/SidebarProvider";
import { UserProvider } from "@/providers/UserProvider";
import AuthHeader from "@/components/headers/AuthHeader";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div id="DashboardLayout">
      <UserProvider>
        <SidebarProvider>
          <AuthHeader />

          <div className="flex w-svw h-svh pt-16">
            <MainNav />

            <SidebarInset className="overflow-y-auto">
              {children}
            </SidebarInset>
          </div>
        </SidebarProvider>
      </UserProvider>
    </div>
  )
}
