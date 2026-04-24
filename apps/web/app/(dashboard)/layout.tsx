import type { Metadata } from "next";
import MainNav from "@/components/asides/mainNav";
import { SidebarInset, SidebarProvider } from "@/providers/SidebarProvider";
import AuthHeader from "@/components/headers/AuthHeader";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div id="DashboardLayout">
      <SidebarProvider className="flex-col">
        <AuthHeader />

        <div className="flex w-full pt-16 h-[calc(100svh-64px)]">
          <MainNav />

          <SidebarInset className="mx-auto w-full max-w-7xl">
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
