"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Circle, MessagesSquare } from "lucide-react";
import { useAuthForm } from "@/hooks/useAuthForm";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { Button } from "@repo/ui/button";
import { FormError } from "@repo/ui/form-error";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Card, CardHeader } from "@repo/ui/card";

type SignUpValues = {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  password: string;
  confirmPassword: string;
};

export default function SignUpForm() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const { values, error, isLoading, handleChange, handleSubmit } = useAuthForm<SignUpValues>(
    {
      firstname: "",
      lastname: "",
      username: "",
      email: "",
      dobDay: "",
      dobMonth: "",
      dobYear: "",
      password: "",
      confirmPassword: "",
    },
    async (formValues) => {
      if (formValues.password !== formValues.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const day = Number.parseInt(formValues.dobDay, 10);
      const month = Number.parseInt(formValues.dobMonth, 10);
      const year = Number.parseInt(formValues.dobYear, 10);

      const isValidParts =
        Number.isInteger(day) && day >= 1 && day <= 31
        && Number.isInteger(month) && month >= 1 && month <= 12
        && Number.isInteger(year) && year >= 1900 && year <= new Date().getUTCFullYear();

      if (!isValidParts) {
        throw new TypeError("Please enter a valid date of birth");
      }

      const dobIsoDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dobDate = new Date(`${dobIsoDate}T00:00:00.000Z`);
      const isSameDate =
        dobDate.getUTCFullYear() === year
        && dobDate.getUTCMonth() + 1 === month
        && dobDate.getUTCDate() === day;

      if (!isSameDate) {
        throw new TypeError("Please enter a valid date of birth");
      }

      const { error } = await supabase.auth.signUp({
        email: formValues.email,
        password: formValues.password,
        options: {
          data: {
            firstname: formValues.firstname,
            lastname: formValues.lastname,
            dob: dobDate.toISOString(),
          },
        },
      });

      if (error) throw error;

      router.push(AUTH_ROUTES.SIGNUP_SUCCESS);
    }
  );

  return (
    <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
      <Card className="w-full max-w-[640px]">
        <CardHeader className="mb-8 flex items-center gap-8 text-2xl font-medium">
          <Link
            href={AUTH_ROUTES.SIGN_UP}
            className="border-b-4 border-primary pb-2 text-headline"
          >
            Create Account
          </Link>

          <Link
            href={AUTH_ROUTES.SIGN_IN}
            className="text-muted transition hover:text-text"
          >
            Sign in
          </Link>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2.5">
              <Label htmlFor="firstname" variant={"auth"}>
                Firstname
              </Label>
              <Input
                id="firstname"
                type="text"
                placeholder="Jhon"
                value={values.firstname}
                onChange={(e) => handleChange("firstname", e.target.value)}
                variant={"auth"}
                autoFocus
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="lastname" variant={"auth"}>
                Lastname
              </Label>
              <Input
                id="lastname"
                type="text"
                placeholder="Doe"
                value={values.lastname}
                onChange={(e) => handleChange("lastname", e.target.value)}
                variant={"auth"}
                required
              />
            </div>
          </div>

         <div className="space-y-2.5">
            <Label htmlFor="email" variant={"auth"}>
              Email
            </Label>
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
            <Label htmlFor="dob-day" variant={"auth"}>
              Date of birth
            </Label>
            <div className="grid grid-cols-3">
              <Input
                id="dob-day"
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="DD"
                value={values.dobDay}
                onChange={(e) => handleChange("dobDay", e.target.value.replaceAll(/\D/g, ""))}
                variant={"auth"}
                className="text-center rounded-none rounded-l-full"
                required
              />
              <Input
                id="dob-month"
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="MM"
                value={values.dobMonth}
                onChange={(e) => handleChange("dobMonth", e.target.value.replaceAll(/\D/g, ""))}
                variant={"auth"}
                className="text-center rounded-none z-0"
                required
              />
              <Input
                id="dob-year"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="YYYY"
                value={values.dobYear}
                onChange={(e) => handleChange("dobYear", e.target.value.replaceAll(/\D/g, ""))}
                variant={"auth"}
                className="text-center rounded-none rounded-r-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pb-4">
            <div className="space-y-2.5">
              <Label htmlFor="password" variant={"auth"}>
                Password
              </Label>
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

            <div className="space-y-2.5">
              <Label htmlFor="confirmfname" variant={"auth"}>
                Confirm Password
              </Label>
              <Input
                id="confirmfname"
                type="password"
                placeholder="••••••••"
                value={values.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                variant={"auth"}
                required
              />
            </div>
          </div>

          <FormError message={error} className="pb-4" />

          <Button
            type="submit"
            disabled={isLoading}
            className="h-14 w-full rounded-full bg-gradient-to-r from-primary to-secondary text-base font-semibold text-text-secondary shadow-[0_18px_45px_rgba(190,127,255,0.35)] transition hover:brightness-105"
          >
            <span>{isLoading ? "Creating account" : "Create profile"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-4 pt-2 text-[0.65rem] uppercase tracking-[0.34em] text-text-muted">
            <span className="h-px flex-1 bg-white/10" />
            <span>Or continue with</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-full border-0 bg-popover text-headline shadow-none hover:bg-input"
            >
              <MessagesSquare className="h-4 w-4 text-[#5f7cff]" />
              Discord
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-full border-0 bg-surface-highest text-headline shadow-none hover:bg-input"
            >
              <Circle className="h-4 w-4 text-primary" />
              Google
            </Button>
          </div>

          <p className="mx-auto max-w-md pt-3 text-center text-[0.62rem] uppercase leading-5 tracking-[0.28em] text-text-muted">
            By continuing, you agree to our
            {" "}
            <Link
              href={AUTH_ROUTES.TERMS_OF_SERVICE}
              className="text-secondary hover:text-primary"
            >
              Terms of Service
            </Link>
            {" "}and{" "}
            <Link
              href={AUTH_ROUTES.PRIVACY_POLICY}
              className="text-secondary hover:text-primary"
            >
              Privacy Policy
            </Link>
          </p>
        </form>
      </Card>
    </section>
  );
}
