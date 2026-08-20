import { UserProvider } from "@/providers/UserProvider";
import { type Metadata } from "next";
import { requireUser } from "@/lib/auth/requireUser";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { account } = await requireUser();
  if (!account) redirect(AUTH_ROUTES.SIGN_IN);

  return <UserProvider>{children}</UserProvider>;
}
