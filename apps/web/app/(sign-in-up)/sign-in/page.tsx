"use client";
import { Card, CardHeader } from "@repo/ui/card";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { FormError } from "@repo/ui/form-error";
import { useAuthForm } from "@/hooks/useAuthForm";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignIn() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const { values, error, isLoading, handleChange, handleSubmit } = useAuthForm({ email: "", password: "" }, async (values) => {
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
    if (error) throw error;

    router.replace(AUTH_ROUTES.HOME);
  });

  return (
    <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
      <Card className="w-full max-w-[640px]">
        <CardHeader className="mb-8 flex items-center gap-8 text-2xl font-medium">
          <Link
            href={AUTH_ROUTES.SIGN_UP}
            className="text-muted transition hover:text-text"
          >
            Create Account
          </Link>

          <Link
            href={AUTH_ROUTES.SIGN_IN}
            className="border-b-4 border-primary pb-2 text-headline"
          >
            Sign in
          </Link>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <div className="space-y-2.5">
              <Label htmlFor="email" variant={"auth"}>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@pawpal.com"
                value={values.email}
                onChange={(e) => handleChange("email", e.target.value)}
                variant={"auth"}
                required
              />
            </div>
              
            <div className="space-y-2.5">
              <div className="flex items-center">
                <Label htmlFor="password" variant={"auth"}>Password</Label>

                <Link
                  href={AUTH_ROUTES.FORGOT_PASSWORD}
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>

              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={values.password}
                onChange={(e) => handleChange("password", e.target.value)}
                variant={"auth"}
                required
              />
            </div>

            <FormError message={error} className="pb-4" />

            <Button
              type="submit"
              disabled={isLoading}
              className="h-14 w-full rounded-full bg-gradient-to-r from-primary to-secondary text-base font-semibold text-text-secondary shadow-[0_18px_45px_rgba(190,127,255,0.35)] transition hover:brightness-105"
            >
              <span>Sign in</span>
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
