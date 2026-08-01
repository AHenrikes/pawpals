import { SidebarInset, SidebarProvider } from "@/providers/SidebarProvider";
import { UserProvider } from "@/providers/UserProvider";
import { type Metadata } from "next";
import Header from "@/components/navigation/Header";
import MainNav from "@/components/navigation/Aside";
import { HomeTabsProvider } from "@/providers/HomeTabsProvider";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
