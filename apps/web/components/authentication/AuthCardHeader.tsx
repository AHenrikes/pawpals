import { AUTH_ROUTES } from "@/lib/auth/routes";
import { CardHeader } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";
import { TypographyH4 } from "@repo/ui/typography";
import Link from "next/link";

export default function AuthCardHeader({
  activePath,
}: Readonly<{ activePath: string }>) {
  return (
    <CardHeader className="grid grid-cols-2 p-1 bg-secondary text-center rounded-sm shadow-xl overflow-hidden">
      <Link
        href={AUTH_ROUTES.SIGN_IN}
        className={cn(
          "p-3 rounded-xs",
          activePath === AUTH_ROUTES.SIGN_IN ? "bg-accent" : null,
        )}
      >
        <TypographyH4>Sign in</TypographyH4>
      </Link>

      <Link
        href={AUTH_ROUTES.SIGN_UP}
        className={cn(
          "p-3 rounded-xs",
          activePath === AUTH_ROUTES.SIGN_UP ? "bg-accent" : null,
        )}
      >
        <TypographyH4>Sign up</TypographyH4>
      </Link>
    </CardHeader>
  );
}
