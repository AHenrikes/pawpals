"use client";

import { FursonaTypes } from "@/types/fursona";
import { useEffect } from "react";
import { toast } from "@repo/ui/sonner";
import { useQuery } from "@tanstack/react-query";

export const useFursonaData = (fursonaId: string | undefined) => {
  const query = useQuery({
    queryKey: ["fursona", fursonaId],
    enabled: !!fursonaId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch(
        `/api/core/fursonas/${encodeURIComponent(fursonaId!)}`,
      );

      if (res.status === 404) return null;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }

      return (await res.json()) as FursonaTypes;
    },
  });

  useEffect(() => {
    if (query.error) toast.error("Could not fetch users");
  }, [query.error]);

  return {
    user: query.data ?? null,
    loading: query.isLoading,
  };
};
