"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Mail } from "lucide-react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useAuthForm } from "@/hooks/useAuthForm";
import { AUTH_ROUTES } from "@/lib/constants/auth";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import AuthHeader from "@/components/navigations/SignHeader";
import AuthFooter from "@/components/pages/(sign-in-up)/AuthFooter";
import Link from "next/link";
import {
  TypographyH2,
  TypographyP,
  TypographySmall,
  TypographyXSmall,
} from "@repo/ui/typography";

export default function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const supabase = useSupabaseClient();

  const { values, error, isLoading, handleChange, handleSubmit } = useAuthForm(
    { email: "" },
    async (values) => {
      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email,
        {
          redirectTo: `${globalThis.window?.location.origin ?? ""}${AUTH_ROUTES.UPDATE_PASSWORD}`,
        },
      );

      if (error) throw error;
    },
    {
      onSuccess: () => setSubmitted(true),
    },
  );

  const isSubmitted = submitted && !error && !isLoading;

  return (
    <>
      <AuthHeader />

      <main className="relative flex min-h-[calc(100svh-144px)] items-center justify-center overflow-hidden p-6 md:p-10 select-none">
        {/* Background Glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-24 h-125 w-125 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              // Submitted email:
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border border-border rounded-sm shadow-2xl">
                  <CardContent className="flex flex-col items-center px-6 py-10 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10"
                    >
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </motion.div>

                    <TypographyH2>Check your inbox</TypographyH2>

                    <TypographyXSmall className="mt-3 text-muted-foreground">
                      If an account exists for
                    </TypographyXSmall>

                    <TypographyP className="mt-1 font-medium break-all">
                      {values.email}
                    </TypographyP>

                    <TypographySmall className="mt-4">
                      We&apos;ve sent password reset instructions. Follow the
                      link in the email to create a new password.
                    </TypographySmall>

                    <Button
                      variant="outline"
                      className="mt-8"
                      onClick={() => setSubmitted(false)}
                    >
                      Use another email
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              // Forgot password:
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="space-y-10">
                  <CardHeader className="space-y-5 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-6 w-6" />
                    </div>

                    <div className="space-y-2">
                      <CardTitle className="text-3xl">
                        Forgot your password?
                      </CardTitle>

                      <CardDescription className="mx-auto max-w-sm">
                        Enter the email associated with your account and
                        we&apos;ll send you a secure link to reset your
                        password.
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-6">
                        <div>
                          <Label
                            htmlFor="email"
                            variant="muted"
                            className="sr-only"
                          >
                            Email address
                          </Label>

                          <Input
                            id="email"
                            type="email"
                            variant={"variant"}
                            placeholder="example@pawpals.com"
                            value={values.email}
                            onChange={(e) =>
                              handleChange("email", e.target.value)
                            }
                            className="h-14"
                            required
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="h-11 w-full"
                        >
                          {isLoading
                            ? "Sending reset email..."
                            : "Send reset email"}
                        </Button>
                      </div>

                      <div className="text-center text-sm text-muted-foreground">
                        Remember your password?{" "}
                        <Link
                          href={AUTH_ROUTES.SIGN_IN}
                          className="text-foreground underline underline-offset-4 transition-opacity hover:opacity-80"
                          draggable="false"
                        >
                          Sign in
                        </Link>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AuthFooter />
    </>
  );
}
