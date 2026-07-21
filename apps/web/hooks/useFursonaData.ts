"use client";

import { FursonaTypes } from "@/types/fursona";
import { useEffect, useState } from "react";
import { toast } from "@repo/ui/sonner";

const fursonaDataCache = new Map<string, Promise<FursonaTypes | null>>();
const fursonaDataStore = new Map<string, FursonaTypes | null>();

export const useFursonaData = (fursonaId: string | undefined) => {
  const [user, setUser] = useState<FursonaTypes | null>(() => {
    if (!fursonaId) return null;
    return fursonaDataStore.get(fursonaId) ?? null;
  });
  const [loading, setLoading] = useState(() => {
    if (!fursonaId) return false;
    return !fursonaDataStore.has(fursonaId);
  });

  useEffect(() => {
    if (!fursonaId) {
      setUser(null);
      setLoading(false);
      return;
    }

    const cachedUser = fursonaDataStore.get(fursonaId);
    if (cachedUser !== undefined) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }

    const pendingRequest = fursonaDataCache.get(fursonaId);
    if (pendingRequest) {
      setLoading(true);
      pendingRequest
        .then((result) => {
          setUser(result);
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    setLoading(true);

    const fetchUser = async () => {
      try {
        const res = await fetch(
          `/api/core/fursonas/${encodeURIComponent(fursonaId)}`,
        );

        if (res.status === 404) {
          fursonaDataStore.set(fursonaId, null);
          return null;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }

        const nextUser = (await res.json()) as FursonaTypes;
        fursonaDataStore.set(fursonaId, nextUser);
        return nextUser;
      } catch {
        toast.error("Could not fetch users");
        return null;
      } finally {
        setLoading(false);
      }
    };

    const request = fetchUser().then((result) => {
      setUser(result);
      return result;
    });

    fursonaDataCache.set(fursonaId, request);
    request.finally(() => {
      fursonaDataCache.delete(fursonaId);
    });
  }, [fursonaId]);

  return { user, loading };
};
