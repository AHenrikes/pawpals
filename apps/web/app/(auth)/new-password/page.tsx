"use client";

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
import { FormError } from "@/components/ui/form-error";
import { useRouter } from "next/navigation";

export default function UpdatePassword() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const { values, error, isLoading, handleChange, handleSubmit } = useAuthForm(
    { password: "" },
    async (values) => {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (error) throw error;
      router.push(AUTH_ROUTES.HOME);
    },
  );

  return (
    <main className="container flex min-h-svh items-center justify-center py-8 sm:py-12">
      <Card className="w-full max-w-md rounded-2xl bg-secondary-dim/80 p-4 shadow-2xl ring-1 ring-white/5 sm:p-7">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>

          <CardDescription>
            Please enter your new password below.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>

                <Input
                  id="password"
                  type="password"
                  placeholder="New password"
                  required
                  value={values.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
              </div>

              <FormError message={error} />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save new password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
