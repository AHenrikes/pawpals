import { NextResponse, type NextRequest } from "next/server";
import requireUser from "@/lib/auth/requireUser";

type RouteContext = {
	params: Promise<{ id: string }> | { id: string };
};

function Unauthorized() {
	return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(_request: NextRequest, context: RouteContext) {
	const { supabase, user, response } = await requireUser();

	if (response) {
		return response;
	}

	if (!user) {
		return Unauthorized();
	}

	const { id } = await Promise.resolve(context.params);

	// Until admin access exists, only allow fetching the signed-in user's account.
	if (id !== user.id) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const { data: account, error } = await supabase
		.schema("core")
		.from("accounts")
		.select("user_id, firstname, lastname, email, dob, created_at")
		.eq("user_id", id)
		.maybeSingle();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	if (!account) {
		return NextResponse.json({ error: "Account not found." }, { status: 404 });
	}

	return NextResponse.json({ account });
}
