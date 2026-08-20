"use client";

import { useEffect } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { toast } from "@repo/ui/sonner";
import type { MessageType } from "@/types/messages";

/**
 * Subscribes to all message INSERT events visible to the signed-in user.
 * RLS on `messages` ensures callers only receive conversations they belong
 * to, which allows the page to update unread counts and ordering even when a
 * different conversation is currently open.
 *
 * `onMessage` should be wrapped in useCallback by the caller — a new
 * function identity every render would tear the channel down and
 * resubscribe on every render.
 */
export function useRealtimeMessages(onMessage: (message: MessageType) => void) {
  const supabase = useSupabaseClient();

  useEffect(() => {
    const channel = supabase.channel("messages:all");

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => onMessage(payload.new as MessageType),
      )
      .subscribe((_status, err) => {
        if (err) toast.error("Realtime subscribe error");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onMessage, supabase]);
}
