import { UserProvider } from "@/providers/UserProvider";
import { requireUser } from "@/lib/auth/requireUser";
import { AUTH_ROUTES } from "@/lib/constants/auth";
import { redirect } from "next/navigation";
import { QueryProvider } from "@/providers/QueryProvider";
import { PageTransitionProvider } from "@/components/transitions/PageTransitionProvider";
import { type Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { account } = await requireUser();
  if (!account) redirect(AUTH_ROUTES.SIGN_IN);

  return (
    <PageTransitionProvider>
      <QueryProvider>
        <UserProvider>{children}</UserProvider>
      </QueryProvider>
    </PageTransitionProvider>
  );
}
