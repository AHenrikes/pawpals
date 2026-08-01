"use client";

import { FursonaTypes } from "@/types/fursona";
import { useEffect, useState } from "react";
import { toast } from "@repo/ui/sonner";
import { fursonaCache } from "@/lib/helpers/profile-cache";

export const useFursonaData = (fursonaId: string | undefined) => {
  const [user, setUser] = useState<FursonaTypes | null>(() => {
    if (!fursonaId) return null;
    return fursonaCache.peek(fursonaId) ?? null;
  });
  const [loading, setLoading] = useState(() => {
    if (!fursonaId) return false;
    return !fursonaCache.has(fursonaId);
  });

  useEffect(() => {
    let active = true;

    if (!fursonaId) {
      setUser(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const cachedUser = fursonaCache.peek(fursonaId);
    if (cachedUser !== undefined) {
      setUser(cachedUser);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);

    fursonaCache
      .get(fursonaId, async () => {
        const res = await fetch(
          `/api/core/fursonas/${encodeURIComponent(fursonaId)}`,
        );

        if (res.status === 404) return null;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }

        return (await res.json()) as FursonaTypes;
      })
      .then((result) => {
        if (active) setUser(result);
      })
      .catch(() => {
        toast.error("Could not fetch users");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fursonaId]);

  return { user, loading };
};
