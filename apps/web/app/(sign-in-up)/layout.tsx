import SignFooter from "@/components/footers/signFooter";
import SignHeader from "@/components/headers/signHeader";
import { Card, CardContent, CardDescription } from "@repo/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Register || Login" };

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SignHeader />

      <div className="grid h-svh flex-1 grid-cols-1 mx-auto lg:grid-cols-[1.05fr_0.95fr] lg:border-t lg:border-white/10">
        <section className="hidden bg-surface-low sm:px-8 lg:flex pt-60">
          <div className="mx-auto flex w-full h-full max-w-[720px] flex-col gap-16">
            <h1 className="max-w-2xl text-4xl font-semibold leading-[0.92] sm:text-5xl lg:text-7xl">
              Connect with the <span className="text-primary">global pack.</span>
            </h1>

            <Card className="h-3/6 w-full max-w-[620px] -rotate-6 rounded-[2rem] border border-white/5 bg-background p-5 shadow-[0_28px_80px_rgba(0,0,0,0.52)]">
              <CardContent className="relative h-full overflow-hidden rounded-[2rem] border-border bg-background p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] rotate-3">
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
                  <p className="text-[0.68rem] uppercase tracking-[0.45em] text-[#cb8fff]">
                    Featured artist
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[0.14em] text-white">
                    LUNA_STARDUST
                  </h2>
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {children}
      </div>

      <SignFooter />
    </>
  );
}
