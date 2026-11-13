import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import ProfileConnections, {
  type ConnectionTab,
} from "@/components/pages/profile/ProfileConnections";
import ReturnHeader from "@/components/navigations/ReturnHeader";

const TABS: ConnectionTab[] = [
  "followers",
  "following",
  "subscribers",
  "requests",
  "subscribed",
];

export default async function ConnectionsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}>) {
  const showPage = false;
  const [{ username }, { tab }, { supabase, account }] = await Promise.all([
    params,
    searchParams,
    requireUser(),
  ]);
  if (!account) notFound();

  const { data, error } = await supabase
    .schema("social")
    .rpc("get_fursona_profile_by_identifier", {
      p_identifier: username,
      p_actor_fursona_id: account.default_fursona_id,
    })
    .maybeSingle();

  if (error || !data) notFound();

  const profile = data as { id: string };
  const { data: owned } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("id", profile.id)
    .eq("account_id", account.id)
    .maybeSingle();
  const isOwner = Boolean(owned);
  const requestedTab = TABS.find((value) => value === tab);
  const initialTab =
    requestedTab &&
    (isOwner || requestedTab === "followers" || requestedTab === "following")
      ? requestedTab
      : "followers";

  return showPage ? (
    <div className="min-h-svh bg-background text-text">
      <ReturnHeader />

      <div className="mx-auto flex min-h-svh max-w-3xl flex-col pt-16 md:px-4 md:py-24">
        <div className="flex min-h-[calc(100svh-4rem)] flex-col border-border/50 bg-background md:min-h-[70vh] md:rounded-xl md:border">
          <ProfileConnections
            key={`${profile.id}:${initialTab}`}
            id={profile.id}
            initialTab={initialTab}
            isOwner={isOwner}
          />
        </div>
      </div>
    </div>
  ) : (
    <h1>Page does not exist</h1>
  );
}
