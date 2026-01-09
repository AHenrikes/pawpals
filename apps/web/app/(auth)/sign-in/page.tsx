"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
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
    
    if (typeof globalThis === "undefined") {
      router.push(AUTH_ROUTES.HOME);
    } else {
      globalThis.location.assign(AUTH_ROUTES.HOME);
    }
  });

  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign In</CardTitle>

            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={values.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
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
                    required
                    value={values.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                </div>
                <FormError message={error} />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href={AUTH_ROUTES.SIGNUP}
                  className="underline underline-offset-4"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
