import UnAuthHeader from "@/components/navigation/PublicHeader";
import { requireUser } from "@/lib/auth/requireUser";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Home" };

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireUser();
  if (user) {
    redirect(AUTH_ROUTES.HOME);
  }

  return (
    <div id="PublicLayout">
      <UnAuthHeader />

      {children}
    </div>
  );
}
