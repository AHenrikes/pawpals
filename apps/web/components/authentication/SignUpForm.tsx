import { Field, FieldGroup, FieldLabel } from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FormError } from "../ui/form-error";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useRef, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@repo/ui/input-group";
import { type FursonaCreate } from "@/types/fursona";
import CreateFursona from "../features/CreateFursona";
import AuthCardFooter from "./AuthCardFooter";

interface SignUpValues {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  initFursona: FursonaCreate;
}

type SetSignUpValues = React.Dispatch<React.SetStateAction<SignUpValues>>;

interface SignUpFormProp {
  values: SignUpValues;
  setValues: SetSignUpValues;
  error: string | null;
  isLoading: boolean;
  setError: (error: string | null) => void;
  handleChange: (field: keyof SignUpValues, value: string) => void;
  handleSubmit: React.ChangeEventHandler<HTMLFormElement>;
  setIsUsernameAvailable: (isAvailable: boolean) => void;
}

type SignUpStep = "account" | "fursona";

export default function SignUpForm({
  values,
  setValues,
  error,
  isLoading,
  setError,
  handleChange,
  handleSubmit,
  setIsUsernameAvailable
} : Readonly<SignUpFormProp>) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const stepTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

  const [step, setStep] = useState<SignUpStep>("account");
  const [showPassword, setShowPassword] = useState(false);

  const updateMainFursona = (field: keyof FursonaCreate, value: string) => {
    setValues((prev) => ({
      ...prev,
      initFursona: { ...prev.initFursona, [field]: value },
    }));
    setError(null);
  };

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

  return (
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
              <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="first-name">Firstname</FieldLabel>

                  <Input
                    id="first-name"
                    type="text"
                    placeholder="Jhon"
                    value={values.firstname}
                    onChange={(e) =>
                      handleChange("firstname", e.target.value)
                    }
                    variant={"variant"}
                    autoFocus={step === "account"}
                    className="h-12"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="last-name">Lastname</FieldLabel>

                  <Input
                    id="last-name"
                    type="text"
                    placeholder="Doe"
                    value={values.lastname}
                    onChange={(e) =>
                      handleChange("lastname", e.target.value)
                    }
                    variant={"variant"}
                    className="h-12"
                    required
                  />
                </Field>
              </FieldGroup>

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
                  required
                />
              </Field>

              {/* <Field className="hidden">
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
                    className="h-12 text-center rounded-none rounded-r-full"
                    required
                  />
                </div>
              </Field> */}

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>

                  <InputGroup className="h-12 pr-2 bg-secondary border-none rounded-sm has-[[data-slot=input-group-control]:focus-visible]:ring-foreground/10 has-[[data-slot=input-group-control]:focus-visible]:ring-1">
                    <InputGroupInput
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={showPassword ? "password" : "••••••••"}
                      value={values.password}
                      onChange={(e) =>
                        handleChange("password", e.target.value)
                      }
                      className="focus-visible:ring-foreground/10"
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
                      {!showPassword ? (
                        <EyeOffIcon />
                      ) : (
                        <EyeIcon />
                      )}
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmfname">
                    Confirm Password
                  </FieldLabel>

                  <Input
                    id="confirmfname"
                    type="password"
                    placeholder="••••••••"
                    value={values.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    variant={"variant"}
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

      <AuthCardFooter
        values={values}
        isLoading={isLoading}
        step={step}
        setStep={setStep}
        goToFursonaStep={goToFursonaStep}
      />
    </form>
  )
}
