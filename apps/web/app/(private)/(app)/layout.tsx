import { SidebarInset, SidebarProvider } from "@/providers/SidebarProvider";
import { type Metadata } from "next";
import Header from "@/components/navigations/Header";
import MainNav from "@/components/navigations/Aside";

export const metadata: Metadata = { title: "Dashboard" };

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider id="AppLayout" className="flex flex-col">
      <Header />

      <SidebarInset>
        <MainNav />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
