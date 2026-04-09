import type { Metadata } from "next";
import MainNav from "@/components/asides/mainNav";
import { SidebarInset, SidebarProvider } from "@/providers/SidebarProvider";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div id="DashboardLayout">
      <SidebarProvider defaultOpen>
        <MainNav />

        <SidebarInset className="mx-auto w-full max-w-7xl">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
