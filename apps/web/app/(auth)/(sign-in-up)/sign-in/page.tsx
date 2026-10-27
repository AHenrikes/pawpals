"use client";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { FormError } from "@/components/ui/form-error";
import { useAuthForm } from "@/hooks/useAuthForm";
import { AUTH_ROUTES } from "@/lib/constants/auth";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { usePageTransition } from "@/components/transitions/PageTransitionProvider";
import { Circle, EyeIcon, EyeOffIcon, MessagesSquare } from "lucide-react";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/field";
import { validateSignIn } from "@/lib/auth/auth-validation";
import Link from "next/link";
import AuthCardHeader from "@/components/pages/(sign-in-up)/AuthCardHeader";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@repo/ui/input-group";
import { useState } from "react";
import { TypographyH2, TypographyP } from "@repo/ui/typography";

export default function SignIn() {
  const { navigate } = usePageTransition();
  const supabase = useSupabaseClient();

  const [showPassword, setShowPassword] = useState(false);

  const { values, error, handleChange, handleSubmit } = useAuthForm(
    { email: "", password: "" },
    async (values) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;

      navigate(AUTH_ROUTES.HOME, { replace: true });
    },
    { validate: validateSignIn },
  );

  return (
    <>
      <AuthCardHeader activePath={AUTH_ROUTES.SIGN_IN} />

      <div className="my-8">
        <TypographyH2>Welcome back</TypographyH2>

        <TypographyP>Stay connected with your community</TypographyP>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>

            <Input
              id="email"
              type="email"
              placeholder="Example@pawpals.com"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              variant={"variant"}
              className="h-12"
              autoFocus
              required
            />
          </Field>

          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Password</FieldLabel>

              <Link
                href={AUTH_ROUTES.FORGOT_PASSWORD}
                className="ml-auto inline-block text-sm text-text-muted underline-offset-4 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>

            <InputGroup className="h-12 pr-2 bg-secondary border-none rounded-sm has-[[data-slot=input-group-control]:focus-visible]:ring-foreground/10 has-[[data-slot=input-group-control]:focus-visible]:ring-1">
              <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={values.password}
                onChange={(e) => handleChange("password", e.target.value)}
                variant={"variant"}
                className="h-12"
                required
              />

              <InputGroupAddon
                align={"inline-end"}
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
                className="cursor-pointer text-text-muted hover:text-text"
              >
                {!showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <FormError message={error} className="pb-4" />

          <Button size={"lg"} type="submit" className="h-12 rounded-sm">
            <span>Sign in</span>
          </Button>
        </FieldGroup>

        <div className="flex items-center gap-4 pt-2 text-[0.65rem] uppercase tracking-[0.34em] text-text-muted">
          <span className="h-px flex-1 bg-white/10" />
          <span>Or continue with</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={"outline"}
            className="h-12 rounded-full bg-popover text-headline"
          >
            <MessagesSquare className="h-4 w-4 text-[#5f7cff]" />
            Discord
          </Button>

          <Button
            type="button"
            variant={"outline"}
            className="h-12 rounded-full bg-popover text-headline"
          >
            <Circle className="h-4 w-4 text-primary" />
            Google
          </Button>
        </div>
      </form>
    </>
  );
}
