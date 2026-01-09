"use client";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useAuthForm } from "@/hooks/useAuthForm";
import { AUTH_ROUTES } from "@/lib/auth/routes";
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
import { FormError } from "@repo/ui/form-error";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpForm() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const { values, error, isLoading, handleChange, handleSubmit } =
    useAuthForm({ email: "", password: "", repeatPassword: "" }, async (values) => {
      if (values.password !== values.repeatPassword) {
        throw new Error("Passwords do not match");
      }

      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${globalThis.window?.location.origin ?? ""}${AUTH_ROUTES.HOME}`,
        },
      });
      if (error) throw error;
      router.push(AUTH_ROUTES.SIGNUP_SUCCESS);
    }
  );

  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign up</CardTitle>
            <CardDescription>Create a new account</CardDescription>
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
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={values.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="repeat-password">Repeat Password</Label>
                  </div>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={values.repeatPassword}
                    onChange={(e) =>
                      handleChange("repeatPassword", e.target.value)
                    }
                  />
                </div>
                <FormError message={error} />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating an account..." : "Sign up"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link
                  href={AUTH_ROUTES.SIGNIN}
                  className="underline underline-offset-4"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
