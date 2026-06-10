"use client";

import { useState, useEffect } from "react";
import { makeCache } from "@/lib/helpers/profile-cache";
import { toError } from "@/lib/helpers/error-utils";
import type { FursonaTypes } from "@/types/fursona";

const profileCache = makeCache<FursonaTypes | null>(10 * 60 * 1000);

export function useProfile(username: string) {
  const [profile, setProfile] = useState<FursonaTypes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    profileCache
      .get(username, async () => {
        const res = await fetch(`/api/core/fursonas/${encodeURIComponent(username)}`);

        if (res.status === 404) return null;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }

        return res.json() as Promise<FursonaTypes>;
      })
      .then((data) => { if (!cancelled) setProfile(data); })
      .catch((err) => { if (!cancelled) setError(toError(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [username]);

  return { profile, loading, error };
}
