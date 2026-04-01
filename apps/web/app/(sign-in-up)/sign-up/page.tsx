"use client";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useAuthForm } from "@/hooks/useAuthForm";
import { CardContent, CardHeader } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Button } from "@repo/ui/button";
import { FormError } from "@repo/ui/form-error";
import { useCurrentPath } from "@/hooks/useCurrentPath";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import Link from "next/link";

export default function SignUpForm() {
  const supabase = useSupabaseClient();
  const isSignUpPath = useCurrentPath(AUTH_ROUTES.SIGN_UP);

  const { values, setValues, error, isLoading, handleSubmit } = useAuthForm(
    {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
    async (formValues) => {
      if (formValues.password !== formValues.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      const { error } = await supabase.auth.signUp({
        email: formValues.email,
        password: formValues.password,
      });
      if (error) throw error;
    }
  );

  const handleChange = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col max-w-screen-sm mx-auto mt-32 gap-10">
      <CardHeader className="flex gap-5 items-center">
        <Link
          href={AUTH_ROUTES.SIGN_IN}
          className="text-3xl"
        >
          Sign in
        </Link>

        <Link
          href={AUTH_ROUTES.SIGN_UP}
          className={isSignUpPath ? "text-4xl border-b-4 border-primary" : "text-3xl"}
        >
          Sign up
        </Link>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          <div className="flex gap-4">
            <div className="flex flex-col w-full gap-3">
              <Label>Firstname</Label>
              <Input
                id="fname"
                type="text"
                placeholder="John"
                value={values.firstname}
                onChange={(e) => handleChange("firstname", e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col w-full gap-3">
              <Label>Lastname</Label>
              <Input
                id="lname"
                type="text"
                placeholder="Doe"
                value={values.lastname}
                onChange={(e) => handleChange("lastname", e.target.value)}
                required
              />
            </div>"!"#!
          </div>

          <div className="flex flex-col w-full gap-3">
            <Label>Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@pawpal.com"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col w-full gap-3">
              <Label>Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={values.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col w-full gap-3">
              <Label>Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={values.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                required
              />
            </div>
          </div>

          <FormError message={error} />
          <Button>
            {isLoading ? "Creating account" : "Next"}
          </Button>
        </form>
      </CardContent>
    </div>
  );
}
