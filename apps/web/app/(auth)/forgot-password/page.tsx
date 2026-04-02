"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useAuthForm } from "@/hooks/useAuthForm";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { FormError } from "@repo/ui/form-error";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const supabase = useSupabaseClient();

  const { values, error, isLoading, handleChange, handleSubmit } = useAuthForm({ email: "" }, async (values) => {
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${globalThis.window?.location.origin ?? ""}${AUTH_ROUTES.UPDATE_PASSWORD}`,
    });

    if (error) throw error;
  },{ onSuccess: () => setSubmitted(true)});

  const isSubmitted = submitted && !error && !isLoading;

  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-[640px]">
        {isSubmitted ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>Password reset instructions sent</CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                If you registered using your email and password, you will receive
                a password reset email.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-8 px-6">
              <CardTitle className="text-2xl">Reset Your Password</CardTitle>
              <CardDescription>
                Type in your email and we&apos;ll send you a link to reset your
                password
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
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

                  <FormError message={error} />

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="h-14 w-full rounded-full bg-gradient-to-r from-primary to-secondary text-base font-semibold text-text-secondary shadow-[0_18px_45px_rgba(190,127,255,0.35)] transition hover:brightness-105"
                  >

                    {isLoading ? "Sending..." : "Send reset email"}
                  </Button>
                </div>

                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link
                    href={AUTH_ROUTES.SIGN_IN}
                    className="underline underline-offset-4"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
