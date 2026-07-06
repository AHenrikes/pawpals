"use client"

import { FursonaTypes } from "@/types/fursona";
import { useEffect, useState } from "react";
import { toast } from "@repo/ui/sonner";

export const useFursonaData = (fursonaId: string | undefined) => {
  const [user, setUser] = useState<FursonaTypes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fursonaId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchUser = async () => {
      try {
        const res = await fetch(
          `/api/core/fursonas/${encodeURIComponent(fursonaId)}`,
        );

        if (res.status === 404) return null;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }

        setUser((await res.json()) as FursonaTypes);
      } catch {
        toast.error("Could not fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [fursonaId]);

  return { user, loading };
};
