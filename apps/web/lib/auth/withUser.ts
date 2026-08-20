import { requireUser } from "@/lib/auth/requireUser";
import { unauthorized } from "@/lib/api/responses";
import { type NextRequest } from "next/server";

type RequireUserResult = Awaited<ReturnType<typeof requireUser>>;
export type AuthenticatedUser = RequireUserResult & {
  user: NonNullable<RequireUserResult["user"]>;
  account: NonNullable<RequireUserResult["account"]>;
  response: null;
};

type RouteHandler<Args extends readonly unknown[]> = (
  auth: AuthenticatedUser,
  ...args: Args
) => Promise<Response>;

export function withUser<Args extends readonly unknown[]>(
  handler: RouteHandler<Args>,
) {
  return async (...args: Args): Promise<Response> => {
    const auth = await requireUser();

    if (auth.response || !auth.user || !auth.account) {
      return auth.response ?? unauthorized();
    }

    return handler(
      {
        ...auth,
        user: auth.user,
        account: auth.account,
        response: null,
      },
      ...args,
    );
  };
}

export type ApiRequest = NextRequest;
