import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { TypographyH2, TypographyP } from "@repo/ui/typography";

export default async function SignUpSuccess() {
  return (
    <main className="grid place-content-center h-svh">
      <Card className="text-center space-y-10">
        <CardHeader>
          <CardTitle>
            <TypographyH2>
              Thank you for signing up!
            </TypographyH2>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="border rounded-sm p-4">
          <CardDescription>Check your email to confirm</CardDescription>

          <TypographyP>
            You&apos;ve successfully signed up. Please check your email to
            confirm your account before signing in.
          </TypographyP>
        </CardContent>
      </Card>
    </main>
  );
}
