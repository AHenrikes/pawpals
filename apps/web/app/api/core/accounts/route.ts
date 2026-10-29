import { withUser } from "@/lib/auth/withUser";
import { badRequest, serverError, notFound, ok } from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { type PrivateAccountTypes } from "@/types/account";
import { type FursonaTypes } from "@/types/fursona";
import { type NextRequest } from "next/server";

type AccountPatchBody = {
  firstname?: unknown;
  lastname?: unknown;
  dob?: unknown;
};

type AccountUpdates = {
  firstname?: string | null;
  lastname?: string | null;
  dob?: string | null;
};

type ParsedUpdate<T> = { error: string | null; value?: T };

function parseNameUpdate(
  field: "firstname" | "lastname",
  value: unknown,
): ParsedUpdate<string | null> {
  const label = field === "firstname" ? "First" : "Last";
  if (typeof value !== "string") {
    return { error: `${label} name must be text.` };
  }

  const trimmed = value.trim();
  if (trimmed.length > 80) {
    return { error: `${label} name must be 80 characters or fewer.` };
  }
  return { error: null, value: trimmed || null };
}

function parseDobUpdate(value: unknown): ParsedUpdate<string | null> {
  if (value === null || value === "") return { error: null, value: null };
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: "Date of birth must be a valid past date." };
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value ||
    parsed > new Date()
  ) {
    return { error: "Date of birth must be a valid past date." };
  }
  return { error: null, value };
}

function parseAccountUpdates(body: AccountPatchBody) {
  const updates: AccountUpdates = {};

  for (const field of ["firstname", "lastname"] as const) {
    if (body[field] === undefined) continue;
    const parsed = parseNameUpdate(field, body[field]);
    if (parsed.error) return { error: parsed.error, updates };
    updates[field] = parsed.value ?? null;
  }

  if (body.dob !== undefined) {
    const parsed = parseDobUpdate(body.dob);
    if (parsed.error) return { error: parsed.error, updates };
    updates.dob = parsed.value ?? null;
  }

  return { error: null, updates };
}

export const GET = withUser(
  async ({ supabase, account }, request: NextRequest) => {
    const { data: accountRows, error: accountError } = await supabase
      .schema("core")
      .from("accounts")
      .select("id, user_id, default_fursona_id, status, created_at, updated_at")
      .eq("id", account.id)
      .maybeSingle();

    if (accountError) return serverError(accountError.message);
    if (!accountRows) return notFound(ERROR_MESSAGES.ACCOUNT_NOT_FOUND);

    const { data: accountPrivateRows, error: privateError } = await supabase
      .schema("core")
      .from("account_private_details")
      .select(
        "firstname, lastname, email, dob, phone_number, age_verified_at, created_at, updated_at",
      )
      .eq("account_id", accountRows.id)
      .maybeSingle();

    if (privateError) return serverError(privateError.message);
    if (!accountPrivateRows) return notFound(ERROR_MESSAGES.ACCOUNT_NOT_FOUND);

    const requestedFursonaId =
      request.headers.get("x-acting-fursona-id") ??
      accountRows.default_fursona_id;
    const { data: defaultFursona, error: fursonaError } = await supabase
      .schema("core")
      .from("fursonas")
      .select(
        "id, display_name, username, bio, species, pronouns, avatar_url, banner_url, visibility, profile_theme, featured_achievements, social_links, show_reputation, show_events, show_communities, status, created_at, updated_at",
      )
      .eq("account_id", accountRows.id)
      .eq("id", requestedFursonaId ?? "00000000-0000-0000-0000-000000000000")
      .maybeSingle();

    if (fursonaError) return serverError(fursonaError.message);
    if (!defaultFursona) return notFound(ERROR_MESSAGES.FURSONAS_NOT_FOUND);

    const profile = {
      account_id: accountRows.id,
      account_firstname: accountPrivateRows.firstname,
      account_lastname: accountPrivateRows.lastname,
      account_email: accountPrivateRows.email,
      account_dob: accountPrivateRows?.dob ?? null,
      account_phone_number: accountPrivateRows?.phone_number ?? null,
      account_age_verified_at: accountPrivateRows?.age_verified_at ?? null,
      account_created_at: accountRows.created_at,
      account_updated_at: accountRows.updated_at ?? null,

      current_fursona_id: defaultFursona.id,
      current_fursona_display_name: defaultFursona.display_name,
      current_fursona_username: defaultFursona.username,
      current_fursona_bio: defaultFursona?.bio ?? null,
      current_fursona_species: defaultFursona?.species ?? null,
      current_fursona_pronouns: defaultFursona?.pronouns ?? null,
      current_fursona_avatar_url: defaultFursona?.avatar_url ?? null,
      current_fursona_banner_url: defaultFursona?.banner_url ?? null,
      current_fursona_visibility: defaultFursona?.visibility ?? "public",
      current_fursona_profile_theme: defaultFursona?.profile_theme ?? "dark",
      current_fursona_featured_achievements:
        defaultFursona?.featured_achievements ?? [],
      current_fursona_social_links: defaultFursona?.social_links ?? [],
      current_fursona_show_reputation: defaultFursona?.show_reputation ?? true,
      current_fursona_show_events: defaultFursona?.show_events ?? true,
      current_fursona_show_communities:
        defaultFursona?.show_communities ?? true,
      current_fursona_status: defaultFursona?.status ?? "active",
      current_fursona_created_at: defaultFursona.created_at,
      current_fursona_updated_at: defaultFursona?.updated_at ?? null,
      // current_fursona_is_default: !!defaultFursona,
    };

    const accountData = {
      id: profile.account_id,
      // account_id: profile.account_id,
      user_id: accountRows.user_id,
      default_fursona_id: accountRows.default_fursona_id,
      platform_role: account.platform_role,
      status: accountRows.status,

      firstname: profile.account_firstname,
      lastname: profile.account_lastname,
      email: profile.account_email,
      dob: profile?.account_dob ?? null,
      age_verified_at: accountPrivateRows?.age_verified_at ?? null,
      phoneNumber: accountPrivateRows?.phone_number ?? null,
      created_at: profile.account_created_at,
      updated_at: profile?.account_updated_at ?? null,
    };

    const currentFursona = profile.current_fursona_id
      ? {
          id: profile.current_fursona_id,
          display_name: profile.current_fursona_display_name,
          username: profile.current_fursona_username,
          bio: profile.current_fursona_bio,
          species: profile.current_fursona_species,
          pronouns: profile.current_fursona_pronouns,
          avatar_url: profile.current_fursona_avatar_url,
          banner_url: profile.current_fursona_banner_url,
          visibility: profile.current_fursona_visibility,
          profile_theme: profile.current_fursona_profile_theme,
          featured_achievements: profile.current_fursona_featured_achievements,
          social_links: profile.current_fursona_social_links,
          show_reputation: profile.current_fursona_show_reputation,
          show_events: profile.current_fursona_show_events,
          show_communities: profile.current_fursona_show_communities,
          status: profile.current_fursona_status,
          created_at: profile.current_fursona_created_at,
          updated_at: profile.current_fursona_updated_at,
          // is_default: profile.current_fursona_is_default,
          // is_current: !!profile.current_fursona_is_default,
        }
      : null;

    return ok<{
      account: PrivateAccountTypes;
      currentFursona: FursonaTypes | null;
    }>({
      account: accountData,
      currentFursona,
    });
  },
);

export const PATCH = withUser(
  async ({ supabase, account }, request: NextRequest) => {
    const body = (await request
      .json()
      .catch(() => null)) as AccountPatchBody | null;

    if (!body) return badRequest("Invalid request body.");

    const { updates, error: validationError } = parseAccountUpdates(body);
    if (validationError) return badRequest(validationError);

    if (Object.keys(updates).length === 0) {
      return badRequest("No valid fields to update.");
    }

    const { data, error } = await supabase
      .schema("core")
      .from("account_private_details")
      .update(updates)
      .eq("account_id", account.id)
      .select(
        "firstname, lastname, email, dob, created_at, updated_at, age_verified_at",
      )
      .maybeSingle();

    if (
      error?.code === "23514" &&
      error.message.includes("verified legal details")
    ) {
      return badRequest("Verified name and date of birth cannot be changed.");
    }
    if (error) return serverError(error.message);
    if (!data) return notFound(ERROR_MESSAGES.ACCOUNT_NOT_FOUND);

    return ok({ account: { id: account.id, ...data } });
  },
);
