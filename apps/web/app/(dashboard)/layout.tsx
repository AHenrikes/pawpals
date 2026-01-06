import type { Metadata } from "next";
import Aside from "@/components/Aside";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div id="DashboardLayout">
      <Aside />
      {children}
    </div>
  )
}
