import { UserProvider } from "@/providers/UserProvider";
import { type Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <UserProvider>{children}</UserProvider>;
}
