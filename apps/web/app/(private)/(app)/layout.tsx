import { SidebarInset, SidebarProvider } from "@/providers/SidebarProvider";
import { HeaderSearchProvider } from "@/components/navigations/HeaderSearchProvider";
import { type Metadata } from "next";
import Header from "@/components/navigations/Header";
import MainNav from "@/components/navigations/Aside";

export const metadata: Metadata = { title: "Dashboard" };

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <HeaderSearchProvider>
      <SidebarProvider id="AppLayout" className="flex flex-col">
        <Header />

        <SidebarInset>
          <MainNav />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </HeaderSearchProvider>
  );
}
