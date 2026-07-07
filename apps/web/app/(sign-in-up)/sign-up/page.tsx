"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Circle, MessagesSquare } from "lucide-react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useAuthForm } from "@/hooks/useAuthForm";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/sonner";
import { FormError } from "@repo/ui/form-error";
import { Card, CardHeader } from "@repo/ui/card";
import { TypographyP } from "@repo/ui/typography";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/field";
import { type FursonaCreate } from "@/types/fursona";
import CreateFursona from "@/components/features/CreateFursona";
import Link from "next/link";

type SignUpValues = {
  firstname: string;
  lastname: string;
  email: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  password: string;
  confirmPassword: string;
  initFursona: FursonaCreate;
};

export default function SignUpForm() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const prefersReducedMotion = useReducedMotion();
  const [step, setStep] = useState<"account" | "fursona">("account");
  const [isUsernameAvailable, setIsUsernameAvailable] =
    useState<boolean>(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const stepTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

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
      dobDay: "",
      dobMonth: "",
      dobYear: "",
      password: "",
      confirmPassword: "",
      initFursona: {
        display_name: "",
        username: "",
        species: "",
        pronouns: "",
        bio: "",
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
        bio: formValues.initFursona.bio?.trim(),
      };

      if (normalizedinitFursona.display_name.length === 0) {
        toast.error("Add your fursona name before finishing sign up");
        return;
      }

      const day = Number.parseInt(formValues.dobDay, 10);
      const month = Number.parseInt(formValues.dobMonth, 10);
      const year = Number.parseInt(formValues.dobYear, 10);

      const isValidParts =
        Number.isInteger(day) &&
        day >= 1 &&
        day <= 31 &&
        Number.isInteger(month) &&
        month >= 1 &&
        month <= 12 &&
        Number.isInteger(year) &&
        year >= 1900 &&
        year <= new Date().getUTCFullYear();

      if (!isValidParts) {
        toast.error("Please enter a valid date of birth");
        return;
      }

      const dobIsoDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dobDate = new Date(dobIsoDate);
      const isSameDate =
        dobDate.getUTCFullYear() === year &&
        dobDate.getUTCMonth() + 1 === month &&
        dobDate.getUTCDate() === day;

      if (!isSameDate) {
        toast.error("Please enter a valid date of birth");
        return;
      }

      if (!isUsernameAvailable) {
        toast.error("Username already taken");
        return;
      }

      // TODO:
      // Temporary local development testing - remove before production
      const origin =
        globalThis.window?.location?.origin ?? "http://192.168.1.219:3000";

      const { error } = await supabase.auth.signUp({
        email: formValues.email,
        password: formValues.password,
        options: {
          emailRedirectTo: `${origin}${AUTH_ROUTES.CONFIRM}`,
          data: {
            firstname: formValues.firstname,
            lastname: formValues.lastname,
            dob: dobIsoDate,
            onboarding_init_fursona: normalizedinitFursona,
          },
        },
      });

      // TODO: email validation error display
      if (error) {
        toast.error(ERROR_MESSAGES.SERVER_ERROR);
        return;
      }

      router.push(AUTH_ROUTES.SIGNUP_SUCCESS);
    },
  );

  const goToFursonaStep = () => {
    const form = formRef.current;

    if (!form) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setError(null);
    setStep("fursona");
  };

  const updateMainFursona = (field: keyof FursonaCreate, value: string) => {
    setValues((prev) => ({
      ...prev,
      initFursona: { ...prev.initFursona, [field]: value },
    }));
    setError(null);
  };

  return (
    <section className="flex items-center justify-center px-5 sm:px-8 lg:px-10">
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

        <form
          ref={formRef}
          className="space-y-5"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <motion.div
            layout
            transition={stepTransition}
            className="relative overflow-hidden px-1 py-1"
          >
            <AnimatePresence mode="wait" initial={false}>
              {step === "account" ? (
                <motion.div
                  key="account-step"
                  initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: prefersReducedMotion ? 0 : 24 }}
                  transition={stepTransition}
                  className="space-y-5"
                >
                  {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2.5">
                      <Label htmlFor="firstname" variant={"auth"}>
                        Firstname
                      </Label>

                      <Input
                        id="firstname"
                        type="text"
                        placeholder="Jhon"
                        value={values.firstname}
                        onChange={(e) =>
                          handleChange("firstname", e.target.value)
                        }
                        variant={"auth"}
                        autoFocus={step === "account"}
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
                        onChange={(e) =>
                          handleChange("lastname", e.target.value)
                        }
                        variant={"auth"}
                        required
                      />
                    </div>
                  </div> */}

                  <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="first-name">First Name</FieldLabel>

                      <Input
                        id="first-name"
                        type="text"
                        placeholder="Jhon"
                        value={values.firstname}
                        onChange={(e) =>
                          handleChange("firstname", e.target.value)
                        }
                        autoFocus={step === "account"}
                        variant={"popover"}
                        className="h-12"
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="last-name">Last Name</FieldLabel>

                      <Input
                        id="last-name"
                        type="text"
                        placeholder="Doe"
                        value={values.lastname}
                        onChange={(e) =>
                          handleChange("lastname", e.target.value)
                        }
                        variant={"popover"}
                        className="h-12"
                        required
                      />
                    </Field>
                  </FieldGroup>

                  {/* <div className="space-y-2.5">
                    <Label htmlFor="email" variant={"auth"}>
                      Email
                    </Label>

                    <Input
                      id="email"
                      type="email"
                      placeholder="example@pawpals.com"
                      value={values.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      variant={"auth"}
                      required
                    />
                  </div> */}
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>

                    <Input
                      id="email"
                      type="email"
                      placeholder="example@pawpals.com"
                      value={values.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      variant={"popover"}
                      className="h-12"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="dob-day">Date of birth</FieldLabel>

                    <div className="grid grid-cols-3">
                      <Input
                        id="dob-day"
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        placeholder="DD"
                        value={values.dobDay}
                        onChange={(e) =>
                          handleChange(
                            "dobDay",
                            e.target.value.replaceAll(/\D/g, ""),
                          )
                        }
                        variant={"popover"}
                        className="h-12 text-center rounded-none rounded-l-full"
                        required
                      />

                      <Input
                        id="dob-month"
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        placeholder="MM"
                        value={values.dobMonth}
                        onChange={(e) =>
                          handleChange(
                            "dobMonth",
                            e.target.value.replaceAll(/\D/g, ""),
                          )
                        }
                        variant={"popover"}
                        className="h-12 rounded-none text-center z-0"
                        required
                      />

                      <Input
                        id="dob-year"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="YYYY"
                        value={values.dobYear}
                        onChange={(e) =>
                          handleChange(
                            "dobYear",
                            e.target.value.replaceAll(/\D/g, ""),
                          )
                        }
                        variant={"popover"}
                        className="h-12 text-center rounded-none rounded-r-full"
                        required
                      />
                    </div>
                  </Field>

                  <FieldGroup className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="password">Password</FieldLabel>

                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={values.password}
                        onChange={(e) =>
                          handleChange("password", e.target.value)
                        }
                        variant={"popover"}
                        className="h-12"
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="confirmfname">Confirm Password</FieldLabel>

                      <Input
                        id="confirmfname"
                        type="password"
                        placeholder="••••••••"
                        value={values.confirmPassword}
                        onChange={(e) =>
                          handleChange("confirmPassword", e.target.value)
                        }
                        variant={"popover"}
                        className="h-12"
                        required
                      />
                    </Field>
                  </FieldGroup>
                </motion.div>
              ) : (
                <motion.div
                  key="fursona-step"
                  initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -24 }}
                  transition={stepTransition}
                  className="space-y-5"
                >
                  <CreateFursona
                    fursona={values.initFursona}
                    onFursonaChange={updateMainFursona}
                    isActive={step === "fursona"}
                    onUsernameAvailability={setIsUsernameAvailable}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <FormError message={error} className="pb-4" />

          {step === "account" ? (
            <Button
              onClick={goToFursonaStep}
              disabled={values.email === undefined}
              className="h-10 w-full rounded-full"
            >
              <span>Create Fursona</span>

              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-4">
              <Button
                onClick={() => setStep("account")}
                className="h-10 w-full bg-primary rounded-l-full"
              >
                <ArrowLeft className="h-4 w-4" />

                <span>Back</span>
              </Button>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-10 w-full rounded-r-full"
              >
                <span>{isLoading ? "Creating account..." : "Sign up"}</span>

                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === "account" && (
            <>
              <div className="flex items-center gap-4 pt-2 text-[0.65rem] uppercase tracking-[0.34em] text-text-muted">
                <span className="h-px flex-1 bg-white/10" />
                <span>Or continue with</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-full bg-popover text-headline hover:bg-input"
                >
                  <MessagesSquare className="h-4 w-4 text-[#5f7cff]" />
                  Discord
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-full bg-popover text-headline hover:bg-input"
                >
                  <Circle className="h-4 w-4 text-primary" />
                  Google
                </Button>
              </div>

              <TypographyP className="mx-auto max-w-md pt-3 text-center text-[0.62rem] uppercase leading-5 tracking-[0.28em] text-text-muted">
                By continuing, you agree to our{" "}
                <Link
                  href={AUTH_ROUTES.TERMS_OF_SERVICE}
                  className="text-secondary hover:text-primary"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href={AUTH_ROUTES.PRIVACY_POLICY}
                  className="text-secondary hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </TypographyP>
            </>
          )}
        </form>
      </Card>
    </section>
  );
}
