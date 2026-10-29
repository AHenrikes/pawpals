import { requireUser } from "@/lib/auth/requireUser";
import { badRequest, okNoStore, serverError } from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { isValidProfileSearchTerm } from "@/lib/search/profileSearchLimits";
import { FursonaSearch } from "@/types/fursona";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get("q")?.trim();

  if (!term) {
    return okNoStore<{ fursonas: FursonaSearch[] }>({ fursonas: [] });
  }
  if (!isValidProfileSearchTerm(term)) {
    return badRequest("Search term must contain 3 to 50 characters.");
  }

  const { supabase, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase.schema("core").rpc("search_fursonas", {
    search_term: term,
  });

  if (error?.code === "PT429") {
    return NextResponse.json(
      { error: "Too many profile searches. Try again in a minute." },
      {
        status: 429,
        headers: { "Retry-After": "60", "Cache-Control": "no-store" },
      },
    );
  }
  if (error) return serverError(ERROR_MESSAGES.SERVER_ERROR);

  return okNoStore<{ fursonas: FursonaSearch[] }>({ fursonas: data ?? [] });
}
