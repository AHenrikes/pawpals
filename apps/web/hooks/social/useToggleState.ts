"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api-client";
import { toError } from "@/lib/helpers/error-utils";

interface ToggleStateConfig<T> {
  id?: string;
  endpoint: string;
  queryKey?: string[];
  getIsActive: (response: T) => boolean;
}

export function useToggleState<T>({
  id,
  endpoint,
  queryKey = [],
  getIsActive,
}: ToggleStateConfig<T>) {
  const queryClient = useQueryClient();
  const getIsActiveRef = useRef(getIsActive);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getIsActiveRef.current = getIsActive;
  }, [getIsActive]);

  useEffect(() => {
    if (!id) {
      setIsActive(false);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchState = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<T>(endpoint);

        if (!cancelled) {
          setIsActive(getIsActiveRef.current(response));
        }
      } catch (err) {
        if (!cancelled) {
          setError(toError(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchState();

    return () => {
      cancelled = true;
    };
  }, [endpoint, id]);

  const toggle = useCallback(async () => {
    if (!id) return;

    const previousState = isActive;
    setLoading(true);
    setError(null);

    try {
      const method = previousState ? "delete" : "post";
      await api[method](endpoint);
      setIsActive((current) => !current);

      if (queryKey.length > 0) {
        await queryClient.invalidateQueries({
          queryKey,
        });
      }
    } catch (err) {
      setIsActive(previousState);
      setError(toError(err));
    } finally {
      setLoading(false);
    }
  }, [endpoint, id, isActive, queryClient, queryKey]);

  return {
    isActive,
    loading,
    error,
    toggle,
  };
}
