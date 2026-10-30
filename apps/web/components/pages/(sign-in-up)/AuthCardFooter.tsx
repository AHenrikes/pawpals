import { Button } from "@repo/ui/button";
import { TypographyH4, TypographyP } from "@repo/ui/typography";

type StepSetter = React.Dispatch<React.SetStateAction<"account" | "fursona">>;

interface AuthCardFooterProps {
  values: { email: string };
  isLoading: boolean;
  step: string;
  setStep: StepSetter;
  goToFursonaStep: () => void;
}

export default function AuthCardFooter({
  values,
  isLoading,
  step,
  setStep,
  goToFursonaStep,
}: Readonly<AuthCardFooterProps>) {
  if (step === "account") {
    return (
      <Button
        size="lg"
        onClick={goToFursonaStep}
        disabled={!values.email}
        className="h-12 w-full rounded-sm"
      >
        <TypographyH4>Next</TypographyH4>
      </Button>
    );
  }

  return (
    <div className="flex gap-4">
      <Button
        size="lg"
        onClick={() => setStep("account")}
        className="h-12 w-full rounded-sm bg-accent"
      >
        <TypographyP className="text-text">Back</TypographyP>
      </Button>
      <Button
        size="lg"
        type="submit"
        data-no-page-transition
        disabled={isLoading}
        className="h-12 w-full rounded-sm"
      >
        <TypographyP className="text-text">
          {isLoading ? "Creating account..." : "Sign up"}
        </TypographyP>
      </Button>
    </div>
  );
}
