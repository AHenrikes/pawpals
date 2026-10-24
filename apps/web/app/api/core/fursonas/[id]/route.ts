import { withUser } from "@/lib/auth/withUser";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import {
  FursonaCreate,
  FursonaWithBoolean,
  type FursonaProfile,
} from "@/types/fursona";
import { NextRequest } from "next/server";
import {
  badRequest,
  notFound,
  ok,
  okPrivateRead,
  serverError,
} from "@/lib/api/responses";
import {
  normalizeOptionalText,
  normalizeRequiredName,
} from "@/lib/helpers/normalizeInput";
import { type SupabaseClient } from "@supabase/supabase-js";

const visibilityValues = new Set(["public", "followers_only", "private"]);
const achievementValues = new Set([
  "early_paw",
  "community_builder",
  "event_explorer",
  "trusted_pal",
]);
const socialPlatformValues = new Set([
  "website",
  "bluesky",
  "discord",
  "instagram",
  "telegram",
  "tiktok",
  "twitch",
  "x",
  "youtube",
]);

function normalizeSocialLinks(links: FursonaWithBoolean["social_links"]) {
  if (!Array.isArray(links) || links.length > 6) return null;

  const normalized = links.map((link) => ({
    platform: link.platform,
    url: link.url.trim(),
  }));

  const valid = normalized.every((link) => {
    if (
      !socialPlatformValues.has(link.platform) ||
      !link.url ||
      link.url.length > 300
    )
      return false;
    try {
      return new URL(link.url).protocol === "https:";
    } catch {
      return false;
    }
  });
  return valid ? normalized : null;
}

function parseProfilePreferences(
  body: FursonaWithBoolean,
  updates: Record<string, unknown>,
) {
  if (body.visibility !== undefined) {
    if (!visibilityValues.has(body.visibility))
      return "Invalid profile visibility.";
    updates.visibility = body.visibility;
  }

  for (const field of [
    "show_reputation",
    "show_events",
    "show_communities",
  ] as const) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== "boolean") return `Invalid ${field} value.`;
    updates[field] = body[field];
  }

  if (body.social_links !== undefined) {
    const socialLinks = normalizeSocialLinks(body.social_links);

    if (!socialLinks) return "Add no more than 6 social links using valid HTTPS URLs.";
    updates.social_links = socialLinks;
  }

  if (body.featured_achievements !== undefined) {
    const achievements = body.featured_achievements;

    if (
      !Array.isArray(achievements) ||
      achievements.length > 3 ||
      !achievements.every((item) => achievementValues.has(item))
    ) {
      return "Choose up to 3 valid achievements.";
    }
    updates.featured_achievements = [...new Set(achievements)];
  }

  return null;
}

function buildPatchUpdates(body: FursonaWithBoolean) {
  const updates: Record<string, unknown> = {};

  if (body.display_name !== undefined) {
    const name = normalizeRequiredName(body.display_name);
    if (name.length === 0) {
      return {
        updates,
        error: "Fursona name cannot be empty.",
      };
    }
    updates.display_name = name;
  }

  const optionalFields = [
    "banner_url",
    "avatar_url",
    "species",
    "pronouns",
    "bio",
  ] as const;
  for (const field of optionalFields) {
    if (body[field] !== undefined) {
      updates[field] = normalizeOptionalText(body[field]);
    }
  }

  const preferenceError = parseProfilePreferences(body, updates);
  if (preferenceError) return { updates, error: preferenceError };

  return { updates, error: null };
}

async function applyFursonaPatch(
  supabase: SupabaseClient,
  fursonaId: string,
  accountId: string,
  body: FursonaWithBoolean,
  updates: Record<string, unknown>,
) {
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .schema("core")
      .from("fursonas")
      .update(updates)
      .eq("id", fursonaId)
      .eq("account_id", accountId);
    if (error) return error;
  }

  if (body.is_default === true || body.is_current === true) {
    const { error: setDefaultError } = await supabase.rpc(
      "set_default_fursona",
      {
        p_fursona_id: fursonaId,
      },
    );
    if (setDefaultError) return setDefaultError;
  }

  return null;
}

export const GET = withUser(
  async (
    { supabase },
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;

    if (!id) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

    const { data: profile, error } = await supabase
      .schema("social")
      .rpc("get_fursona_profile_by_identifier", {
        p_identifier: id,
        p_actor_fursona_id: request.headers.get("x-acting-fursona-id") || null,
      })
      .maybeSingle();

    if (error?.code === "PGRST116")
      return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);
    if (error) return serverError(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
    if (!profile) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);
    return okPrivateRead<FursonaProfile>(profile as unknown as FursonaProfile);
  },
);

export const PATCH = withUser(
  async (
    { supabase, account },
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;

    if (!id) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

    const body = (await request.json().catch(() => ({}))) as FursonaWithBoolean;
    const { updates, error } = buildPatchUpdates(body);

    if (error) return badRequest(error);

    const hasUpdates = Object.keys(updates).length > 0;
    const isSettingDefault =
      body.is_default === true || body.is_current === true;

    if (!hasUpdates && !isSettingDefault)
      return badRequest("No valid fields to update.");

    const patchError = await applyFursonaPatch(
      supabase,
      id,
      account.id,
      body,
      updates,
    );

    if (patchError) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

    const { data: fursona, error: fetchError } = await supabase
      .schema("core")
      .from("fursonas")
      .select(
        "id, display_name, username, avatar_url, banner_url, species, pronouns, bio, visibility, social_links, show_reputation, show_events, show_communities, featured_achievements, status, created_at, updated_at",
      )
      .eq("id", id)
      .eq("account_id", account.id)
      .maybeSingle();

    if (fetchError) return serverError(ERROR_MESSAGES.SERVER_ERROR);
    if (!fursona) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

    return ok<{
      fursona: FursonaCreate & { is_default: boolean; is_current: boolean };
    }>({
      fursona: {
        ...fursona,
        is_default:
          account.default_fursona_id === fursona.id || isSettingDefault,
        is_current: false,
      },
    });
  },
);

export const DELETE = withUser(
  async (
    { supabase },
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;

    if (!id) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

    const { error: deleteError } = await supabase.rpc("delete_fursona", {
      p_fursona_id: id,
    });

    if (deleteError) return badRequest(deleteError.message);

    return ok({ ok: true });
  },
);
