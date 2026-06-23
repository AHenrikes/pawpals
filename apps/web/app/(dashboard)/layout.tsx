import { SidebarInset, SidebarProvider } from "@/providers/SidebarProvider";
import { UserProvider } from "@/providers/UserProvider";
import { type Metadata } from "next";
import Header from "@/components/navigation/Header";
import MainNav from "@/components/navigation/MainNav";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div id="DashboardLayout">
      <UserProvider>
        <SidebarProvider className="flex flex-col">
          <Header />

          <SidebarInset>
            <MainNav />

            <div className="w-full">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </UserProvider>
    </div>
  );
}
