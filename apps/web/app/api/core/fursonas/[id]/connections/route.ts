import { type NextRequest } from "next/server";
import { type SupabaseClient } from "@supabase/supabase-js";
import { withUser } from "@/lib/auth/withUser";
import {
  badRequest,
  notFound,
  okNoStore,
  serverError,
} from "@/lib/api/responses";

type Context = { params: Promise<{ id: string }> };
type Tab =
  "followers" | "following" | "subscribers" | "requests" | "subscribed";
type Connection = { fursona_id: string; connected_at: string };
type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRIVATE_TABS = new Set<Tab>(["subscribers", "requests", "subscribed"]);
const TABS = new Set<Tab>([
  "followers",
  "following",
  "subscribers",
  "requests",
  "subscribed",
]);
const PAGE_SIZE = 20;

type ListQuery = {
  tab: Tab;
  sort: "newest" | "oldest";
  search: string;
  page: number;
};

function parseQuery(request: NextRequest): ListQuery | null {
  const params = request.nextUrl.searchParams;
  const tab = params.get("tab");
  const sort = params.get("sort") ?? "newest";
  const search = params.get("search")?.trim() ?? "";
  const page = Number(params.get("page") ?? "0");
  if (
    !tab ||
    !TABS.has(tab as Tab) ||
    (sort !== "newest" && sort !== "oldest") ||
    search.length > 50 ||
    !Number.isSafeInteger(page) ||
    page < 0 ||
    page > 500
  )
    return null;
  return { tab: tab as Tab, sort, search, page };
}

async function loadConnections(
  supabase: SupabaseClient,
  id: string,
  { tab, sort, search, page }: ListQuery,
): Promise<Connection[]> {
  const pagination = { p_limit: PAGE_SIZE, p_offset: page * PAGE_SIZE };
  if (search) {
    const { data, error } = await supabase
      .schema("social")
      .rpc("search_profile_connections", {
        p_fursona_id: id,
        p_direction: tab,
        p_query: search,
        p_sort: sort,
        ...pagination,
      });
    if (error) throw error;
    return data ?? [];
  }
  if (tab === "subscribers" || tab === "subscribed") {
    const { data, error } = await supabase
      .schema("social")
      .rpc("list_profile_subscriptions", {
        p_fursona_id: id,
        p_direction: tab,
        p_sort: sort,
        ...pagination,
      });
    if (error) throw error;
    return data ?? [];
  }
  const column =
    tab === "following" ? "follower_fursona_id" : "followed_fursona_id";
  const otherColumn =
    tab === "following" ? "followed_fursona_id" : "follower_fursona_id";
  const { data, error } = await supabase
    .schema("social")
    .from("follows")
    .select(`${otherColumn}, created_at`)
    .eq(column, id)
    .eq("status", tab === "requests" ? "pending" : "accepted")
    .order("created_at", { ascending: sort === "oldest" })
    .order(otherColumn, { ascending: true })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const otherId = (row as Record<string, unknown>)[otherColumn];
    return typeof otherId === "string"
      ? [{ fursona_id: otherId, connected_at: row.created_at }]
      : [];
  });
}

async function getActingId(
  supabase: SupabaseClient,
  request: NextRequest,
  accountId: string,
  defaultId: string | null,
) {
  const requestedId = request.headers.get("x-acting-fursona-id");
  if (!requestedId || !UUID.test(requestedId)) return defaultId;
  const { data } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("id", requestedId)
    .eq("account_id", accountId)
    .maybeSingle();
  return data ? requestedId : defaultId;
}

export const GET = withUser(
  async ({ supabase, account }, request: NextRequest, { params }: Context) => {
    const { id } = await params;
    const query = parseQuery(request);
    if (!UUID.test(id) || !query)
      return badRequest("Invalid connections query");

    const { data: target, error: targetError } = await supabase
      .schema("social")
      .rpc("get_fursona_profiles_by_ids", { p_ids: [id] });
    if (targetError) return serverError("Unable to load profile");
    if (!target?.length) return notFound("Profile not found");

    const { data: ownership, error: ownershipError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("id", id)
      .eq("account_id", account.id)
      .maybeSingle();
    if (ownershipError) return serverError("Unable to check profile ownership");
    const isOwner = Boolean(ownership);
    if (PRIVATE_TABS.has(query.tab) && !isOwner)
      return notFound("List not found");

    let connections: Connection[];
    try {
      connections = await loadConnections(supabase, id, query);
    } catch {
      return serverError("Unable to load connections");
    }

    const ids = connections.map((item) => item.fursona_id);
    if (!ids.length) return okNoStore({ items: [], hasMore: false });
    const { data: profiles, error: profilesError } = await supabase
      .schema("social")
      .rpc("get_fursona_profiles_by_ids", { p_ids: ids });
    if (profilesError) return serverError("Unable to load connection profiles");

    const actorId = await getActingId(
      supabase,
      request,
      account.id,
      account.default_fursona_id,
    );
    const { data: outbound, error: outboundError } = actorId
      ? await supabase
          .schema("social")
          .from("follows")
          .select("followed_fursona_id, status")
          .eq("follower_fursona_id", actorId)
          .in("followed_fursona_id", ids)
      : { data: [], error: null };
    const { data: inbound, error: inboundError } = actorId
      ? await supabase
          .schema("social")
          .from("follows")
          .select("follower_fursona_id")
          .eq("followed_fursona_id", actorId)
          .eq("status", "accepted")
          .in("follower_fursona_id", ids)
      : { data: [], error: null };
    if (outboundError || inboundError)
      return serverError("Unable to load follow status");

    const profileById = new Map<string, Profile>(
      ((profiles ?? []) as Profile[]).map((profile) => [profile.id, profile]),
    );
    const outboundById = new Map(
      (outbound ?? []).map((follow) => [
        follow.followed_fursona_id,
        follow.status,
      ]),
    );
    const inboundIds = new Set(
      (inbound ?? []).map((follow) => follow.follower_fursona_id),
    );
    const items = connections.flatMap((connection) => {
      const profile = profileById.get(connection.fursona_id);
      if (!profile) return [];
      return [
        {
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          connectedAt: connection.connected_at,
          followsYou: inboundIds.has(profile.id),
          followStatus: outboundById.get(profile.id) ?? null,
          isSelf: profile.id === actorId,
        },
      ];
    });
    return okNoStore({ items, hasMore: connections.length === PAGE_SIZE });
  },
);

export const DELETE = withUser(
  async ({ supabase, account }, request: NextRequest, { params }: Context) => {
    const { id } = await params;
    const body = (await request.json().catch(() => null)) as {
      followerId?: string;
    } | null;
    if (
      !UUID.test(id) ||
      typeof body?.followerId !== "string" ||
      !UUID.test(body.followerId)
    )
      return badRequest("Invalid follower");
    const { data: owned } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("id", id)
      .eq("account_id", account.id)
      .maybeSingle();
    if (!owned) return notFound("Profile not found");
    const { error } = await supabase.schema("social").rpc("remove_follower", {
      p_owner_fursona_id: id,
      p_follower_fursona_id: body.followerId,
    });
    if (error) return serverError("Unable to remove follower");
    return okNoStore({ removed: true });
  },
);
