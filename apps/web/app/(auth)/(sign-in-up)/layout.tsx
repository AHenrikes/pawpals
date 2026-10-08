import { AUTH_ROUTES } from "@/lib/constants/auth";
import { createServer } from "@repo/supabase/server";
import { Card, CardContent, CardDescription } from "@repo/ui/card";
import { TypographyH2, TypographyH3, TypographyP } from "@repo/ui/typography";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AuthFooter from "@/components/pages/(sign-in-up)/AuthFooter";
import AuthHeader from "@/components/navigations/SignHeader";

export const metadata: Metadata = { title: "Register || Login" };

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(AUTH_ROUTES.HOME);
  }

  return (
    <>
      <AuthHeader />

      <main className="container grid min-h-[calc(100svh-9rem)] flex-1 grid-cols-1 items-center gap-8 py-4 sm:py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(26rem,0.95fr)] lg:gap-12 xl:gap-20">
        <section className="hidden w-full lg:flex">
          <div className="flex flex-col justify-center w-full h-full max-w-180 mx-auto gap-4">
            <TypographyH2 className="flex flex-col text-4xl leading-[0.96] xl:text-6xl">
              Connect with the{" "}
              <span className="text-primary">global pack.</span>
            </TypographyH2>

            <Card className="h-[clamp(18rem,40vh,30rem)] w-full max-w-155 -rotate-3 rounded-4xl border border-white/5 bg-background p-4 shadow-[0_28px_80px_rgba(0,0,0,0.52)] xl:-rotate-6 xl:p-5">
              <CardContent className="relative h-full overflow-hidden rounded-4xl border-border bg-background p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] rotate-3">
                <div
                  className="absolute inset-0 opacity-90"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 18% 18%, rgba(255, 22, 88, 0.34) 0, transparent 24%), radial-gradient(circle at 84% 18%, rgba(146, 46, 255, 0.28) 0, transparent 18%), radial-gradient(circle at 38% 78%, rgba(255, 24, 96, 0.18) 0, transparent 18%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent 42%)",
                    filter: "blur(1px)",
                  }}
                />

                <div className="absolute inset-0 bg-[repeating-linear-gradient(120deg,transparent_0,transparent_17px,rgba(255,0,84,0.11)_18px,transparent_24px)] opacity-40" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(0,0,0,0.42)_76%)]" />

                <CardDescription className="relative flex h-full flex-col justify-end">
                  <TypographyP className="text-[0.68rem] uppercase tracking-[0.45em] text-[#cb8fff]">
                    Featured artist
                  </TypographyP>

                  <TypographyH3 className="tracking-[0.14em]">
                    LUNA_STARDUST
                  </TypographyH3>
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="w-full max-w-xl place-self-center rounded-2xl bg-secondary-dim/80 p-4 shadow-2xl ring-1 ring-white/5 sm:p-7 lg:p-8">
          <Card className="space-y-6 sm:space-y-8">{children}</Card>
        </section>
      </main>

      <AuthFooter />
    </>
  );
}
