import { ok, serverError } from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { FursonaSearch } from "@/types/fursona";
import { createServer } from "@repo/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get("q");

  if (!term?.trim()) {
    return NextResponse.json({ fursonas: [] });
  }

  const supabase = await createServer();

  const { data, error } = await supabase
    .schema("core")
    .rpc("search_fursonas", {
      search_term: term,
    }
  );

  if (error) return serverError(ERROR_MESSAGES.SERVER_ERROR);

  return ok<{ fursonas: FursonaSearch }>({ fursonas: data ?? [] });
}
