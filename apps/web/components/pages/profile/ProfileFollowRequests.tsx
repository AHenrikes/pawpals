"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/api-client";
import { Button } from "@repo/ui/button";

type Request = { follower_fursona_id: string; username: string; display_name: string };

export default function ProfileFollowRequests({ id, onChange }: Readonly<{ id: string; onChange: () => Promise<void> }>) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.get<{ requests: Request[] }>(`/api/core/fursonas/${id}/follow-requests`)
      .then((result) => { if (active) setRequests(result.requests); })
      .catch(() => { if (active) setError("Unable to load follow requests."); });
    return () => { active = false; };
  }, [id]);

  async function respond(followerId: string, accept: boolean) {
    setBusy(followerId);
    setError(null);
    try {
      await api.patch(`/api/core/fursonas/${id}/follow-requests`, { followerId, accept });
      setRequests((current) => current.filter((item) => item.follower_fursona_id !== followerId));
      await onChange();
    } catch {
      setError("Unable to update follow request.");
    } finally {
      setBusy(null);
    }
  }

  if (!requests.length && !error) return null;
  return <section className="mt-4 rounded-xl border border-border/30 p-4">
    <h2 className="font-semibold">Follow requests</h2>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {requests.map((item) => <div key={item.follower_fursona_id} className="flex items-center justify-between gap-3 py-2">
      <span>{item.display_name} <span className="text-text-muted">@{item.username}</span></span>
      <span className="flex gap-2">
        <Button disabled={busy === item.follower_fursona_id} onClick={() => void respond(item.follower_fursona_id, true)}>Accept</Button>
        <Button variant="outline" disabled={busy === item.follower_fursona_id} onClick={() => void respond(item.follower_fursona_id, false)}>Reject</Button>
      </span>
    </div>)}
  </section>;
}
