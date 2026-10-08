import { requireUser } from "@/lib/auth/requireUser";
import { AUTH_ROUTES } from "@/lib/constants/auth";
import { redirect } from "next/navigation";
import { type Metadata } from "next";
import ReturnHeader from "@/components/navigations/ReturnHeader";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { account } = await requireUser();
  if (!account) redirect(AUTH_ROUTES.SIGN_IN);

  return (
    <>
      <ReturnHeader />

      {children}
    </>
  );
}
