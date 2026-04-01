import type { Metadata } from "next";
import SignHeader from "@/components/headers/signHeader";
import SignFooter from "@/components/footers/signFooter";
import { Card } from "@repo/ui/card";

export const metadata: Metadata = { title: "Register || Login" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignHeader />

      <main className="grid grid-cols-2 w-full h-screen justify-center">
        <section className="bg-foreground">
          <h1>Connect With the pact!</h1>
        </section>

        <Card role="section">
          {children}
        </Card>
      </main>

      <SignFooter />
    </>
  );
}
