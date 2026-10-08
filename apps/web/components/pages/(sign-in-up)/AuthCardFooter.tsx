import { AUTH_ROUTES } from "@/lib/constants/auth";
import { Button } from "@repo/ui/button";
import { TypographyH4, TypographyP } from "@repo/ui/typography";
import { CircleIcon, MessagesSquareIcon } from "lucide-react";
import Link from "next/link";

type stepValues = React.Dispatch<React.SetStateAction<"account" | "fursona">>;

interface AuthCardFooterProps {
  values: { email: string };
  isLoading: boolean;
  step: string;
  setStep: stepValues;
  goToFursonaStep: () => void;
}

export default function AuthCardFooter({
  values,
  isLoading,
  step,
  setStep,
  goToFursonaStep,
}: Readonly<AuthCardFooterProps>) {
  return (
    <>
      {step === "account" ? (
        <Button
          size={"lg"}
          onClick={goToFursonaStep}
          disabled={values.email === undefined}
          className="h-12 w-full rounded-sm"
        >
          <TypographyH4>Next</TypographyH4>
        </Button>
      ) : (
        <div className="flex gap-4">
          <Button
            size={"lg"}
            onClick={() => setStep("account")}
            className="h-12 w-full bg-accent rounded-sm"
          >
            <TypographyP className="text-text">Back</TypographyP>
          </Button>

          <Button
            size={"lg"}
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-sm"
          >
            <TypographyP className="text-text">
              {isLoading ? "Creating account..." : "Sign up"}
            </TypographyP>
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
              className="h-12 rounded-full bg-popover text-headline"
            >
              <MessagesSquareIcon className="h-4 w-4 text-[#5f7cff]" />
              Discord
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-full bg-popover text-headline"
            >
              <CircleIcon className="h-4 w-4 text-primary" />
              Google
            </Button>
          </div>

          <TypographyP className="mx-auto max-w-md pt-3 text-center text-[0.62rem] uppercase leading-5 tracking-[0.28em] text-text-muted">
            By continuing, you agree to our{" "}
            <Link
              href={AUTH_ROUTES.TERMS_OF_SERVICE}
              className="text-primary-dim hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href={AUTH_ROUTES.PRIVACY_POLICY}
              className="text-primary-dim hover:text-primary"
            >
              Privacy Policy
            </Link>
          </TypographyP>
        </>
      )}
    </>
  );
}
