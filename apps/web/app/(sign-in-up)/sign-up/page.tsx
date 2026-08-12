"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useAuthForm } from "@/hooks/useAuthForm";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { TypographyH2, TypographyP } from "@repo/ui/typography";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { toast } from "@repo/ui/sonner";
import { type FursonaCreate } from "@/types/fursona";
import AuthCardHeader from "@/components/authentication/AuthCardHeader";
import SignUpForm from "@/components/authentication/SignUpForm";

type SignUpValues = {
  firstname: string;
  lastname: string;
  email: string;
  // dobDay: string;
  // dobMonth: string;
  // dobYear: string;
  password: string;
  confirmPassword: string;
  initFursona: FursonaCreate;
};

export default function SignUp() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean>(false);

  const {
    values,
    setValues,
    error,
    isLoading,
    setError,
    handleChange,
    handleSubmit,
  } = useAuthForm<SignUpValues>(
    {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      confirmPassword: "",
      initFursona: {
        display_name: "",
        username: "",
        species: "",
        pronouns: ""
      },
    },

    async (formValues) => {
      if (formValues.password !== formValues.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      const normalizedinitFursona = {
        display_name: formValues.initFursona.display_name.trim(),
        username: formValues.initFursona.username.trim(),
        species: formValues.initFursona.species?.trim(),
        pronouns: formValues.initFursona.pronouns?.trim(),
        // bio: formValues.initFursona.bio?.trim(),
      };

      if (normalizedinitFursona.display_name.length === 0) {
        toast.error("Add your fursona name before finishing sign up");
        return;
      }

      // const day = Number.parseInt(formValues.dobDay, 10);
      // const month = Number.parseInt(formValues.dobMonth, 10);
      // const year = Number.parseInt(formValues.dobYear, 10);

      // const isValidParts =
      //   Number.isInteger(day) &&
      //   day >= 1 &&
      //   day <= 31 &&
      //   Number.isInteger(month) &&
      //   month >= 1 &&
      //   month <= 12 &&
      //   Number.isInteger(year) &&
      //   year >= 1900 &&
      //   year <= new Date().getUTCFullYear();

      // if (!isValidParts) {
      //   toast.error("Please enter a valid date of birth");
      //   return;
      // }

      // const dobIsoDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      // const dobDate = new Date(dobIsoDate);
      // const isSameDate =
      //   dobDate.getUTCFullYear() === year &&
      //   dobDate.getUTCMonth() + 1 === month &&
      //   dobDate.getUTCDate() === day;

      // if (!isSameDate) {
      //   toast.error("Please enter a valid date of birth");
      //   return;
      // }

      if (!isUsernameAvailable) {
        toast.error("Username already taken");
        return;
      }

      const origin = globalThis.window?.location?.origin;

      if (!origin) {
        toast.error(ERROR_MESSAGES.SERVER_ERROR);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: formValues.email,
        password: formValues.password,
        options: {
          emailRedirectTo: `${origin}${AUTH_ROUTES.CONFIRM}`,
          data: {
            firstname: formValues.firstname,
            lastname: formValues.lastname,
            // dob: dobIsoDate,
            onboarding_init_fursona: normalizedinitFursona,
          },
        },
      });

      if (error) {
        toast.error(ERROR_MESSAGES.SERVER_ERROR);
        return;
      }

      router.push(AUTH_ROUTES.SIGNUP_SUCCESS);
    },
  );

  return (
    <>
      <AuthCardHeader activePath={AUTH_ROUTES.SIGN_UP} />

      <div className="my-8">
        <TypographyH2>
          Start Yout Journey
        </TypographyH2>

        <TypographyP>
          Join the pack and explore the community
        </TypographyP>
      </div>

      <SignUpForm
        values={values}
        setValues={setValues}
        error={error}
        isLoading={isLoading}
        setError={setError}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        setIsUsernameAvailable={setIsUsernameAvailable}
      />
    </>
  );
}
