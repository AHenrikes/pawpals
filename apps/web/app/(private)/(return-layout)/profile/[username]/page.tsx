import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import Profile from "@/components/pages/profile/Profile";
import type { FursonaProfile } from "@/types/fursona";

export default async function ProfilePage({
  params
}: Readonly<{ params: Promise<{ username: string }> }>) {
  const { username } = await params;
  const { supabase, account } = await requireUser();
  if (!account) redirect("/sign-in");

  const { data, error } = await supabase
    .schema("social")
    .rpc("get_fursona_profile_by_identifier", {
      p_identifier: username,
      p_actor_fursona_id: account.default_fursona_id,
    })
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();
  const profile = data as unknown as Omit<
    FursonaProfile,
    "created_at" | "updated_at"
  > & {
    can_view_content: boolean;
    created_at: string;
    updated_at: string | null;
  };
  const initialProfile: FursonaProfile | undefined = profile.can_view_content
    ? ({
        ...profile,
        created_at: new Date(profile.created_at),
        updated_at: profile.updated_at ? new Date(profile.updated_at) : null,
      } as FursonaProfile)
    : undefined;

  return (
    <Profile
      username={username}
      initialProfile={initialProfile}
    />
  );
}
