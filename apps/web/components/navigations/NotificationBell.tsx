"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellIcon } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/popover";
import { api } from "@/lib/api/api-client";
import { useUser } from "@/providers/UserProvider";
import { useAppPreferences } from "@/providers/AppPreferencesProvider";
import {
  TypographyH2,
  TypographyP,
  TypographySmall,
  TypographyXSmall,
} from "@repo/ui/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { getInitials } from "@/lib/helpers/getInitials";
import { avatarImageSrc } from "@/lib/uploads/avatarImageSrc";

type FollowRequest = {
  follower_fursona_id: string;
  username: string;
  display_name: string;
  avatarUrl: string | null;
};

export function NotificationBell() {
  const { currentFursona } = useUser();
  const { followRequestAlerts } = useAppPreferences();
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const fursonaId = currentFursona?.id;
  const username = currentFursona?.username;

  useEffect(() => {
    setRequests([]);
    setError(false);
  }, [fursonaId]);

  const loadRequests = useCallback(
    async (id: string, isActive: () => boolean) => {
      setLoading(true);
      try {
        const result = await api.get<{ requests: FollowRequest[] }>(
          `/api/core/fursonas/${id}/follow-requests`,
        );
        if (!isActive()) return;
        setRequests(result.requests);
        setError(false);
      } catch {
        if (isActive()) setError(true);
      } finally {
        if (isActive()) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!fursonaId || (!followRequestAlerts && !open)) return;

    let active = true;
    const refresh = () => {
      if (document.visibilityState === "visible") {
        void loadRequests(fursonaId, () => active);
      }
    };
    refresh();
    const timer = followRequestAlerts
      ? window.setInterval(refresh, 60_000)
      : null;
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      if (timer !== null) window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [fursonaId, followRequestAlerts, open, loadRequests]);

  const badgeCount = followRequestAlerts ? requests.length : 0;
  const reviewHref = username ? `/@${username}?connections=requests` : null;

  async function respond(followerId: string, accept: boolean) {
    if (!fursonaId) return;
    setBusy(followerId);
    setActionError(false);
    try {
      await api.patch(`/api/core/fursonas/${fursonaId}/follow-requests`, {
        followerId,
        accept,
      });
      setRequests((current) =>
        current.filter((request) => request.follower_fursona_id !== followerId),
      );
    } catch {
      setActionError(true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label={
            badgeCount
              ? `Notifications, ${badgeCount} pending follow requests`
              : "Notifications"
          }
          className="glass-control relative rounded-full"
        >
          <BellIcon aria-hidden="true" />
          {badgeCount > 0 && (
            <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={13}
        className="max-h-[min(75dvh,36rem)] w-dvw max-w-md gap-4 p-4 bg-background rounded-none overflow-y-auto md:rounded-md"
      >
        <div className="flex items-center justify-between">
          <TypographyH2 className="text-lg md:text-lg">
            Notifications
          </TypographyH2>
          {requests.length > 0 && (
            <TypographyXSmall>{requests.length} pending</TypographyXSmall>
          )}
        </div>

        {!fursonaId && (
          <TypographyP className="text-sm text-text-muted">
            Create a fursona to receive follow requests.
          </TypographyP>
        )}

        {fursonaId && loading && requests.length === 0 && (
          <TypographyP className="text-sm text-text-muted">
            Loading requests...
          </TypographyP>
        )}

        {fursonaId && error && (
          <TypographyP role="alert" className="text-sm text-destructive">
            Could not load follow requests. Reopen the bell to try again.
          </TypographyP>
        )}

        {actionError && (
          <TypographyP role="alert" className="text-sm text-destructive">
            Could not update the follow request. Please try again.
          </TypographyP>
        )}

        {fursonaId && !loading && !error && requests.length === 0 && (
          <p className="text-sm text-text-muted">No pending follow requests.</p>
        )}

        {requests.length > 0 && (
          <div className="flex flex-col gap-1">
            <TypographySmall>Follow requests</TypographySmall>

            {requests.length > 1 && reviewHref ? (
              <Link
                href={reviewHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-surface p-3 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="flex shrink-0 -space-x-3">
                  {requests.slice(0, 2).map((request) => (
                    <Avatar
                      key={request.follower_fursona_id}
                      className="size-10 border-2 border-background"
                    >
                      <AvatarImage
                        src={avatarImageSrc(request.avatarUrl, 96)}
                        alt=""
                      />

                      <AvatarFallback>
                        {getInitials(request.display_name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </span>

                <span className="min-w-0 text-sm">
                  <span className="block font-semibold">
                    {requests.length} people want to follow you
                  </span>
                  <span className="text-text-muted">Review all requests</span>
                </span>
              </Link>
            ) : (
              <ul className="space-y-2">
                {requests.map((request) => (
                  <li
                    key={request.follower_fursona_id}
                    className="flex rounded-xl bg-surface p-3"
                  >
                    <Link
                      href={`/@${request.username}`}
                      onClick={() => setOpen(false)}
                      className="flex min-w-0 items-center gap-3 hover:opacity-80"
                    >
                      <Avatar className="size-10 shrink-0">
                        <AvatarImage
                          src={avatarImageSrc(request.avatarUrl, 96)}
                          alt=""
                        />

                        <AvatarFallback>
                          {getInitials(request.display_name)}
                        </AvatarFallback>
                      </Avatar>

                      <span className="min-w-0 text-sm">
                        <span className="block truncate font-semibold">
                          {request.display_name}
                        </span>

                        <span className="block truncate text-text-muted">
                          wants to follow you
                        </span>
                      </span>
                    </Link>

                    <div className="mt-3 flex gap-2 pl-13">
                      <Button
                        size="sm"
                        disabled={busy !== null}
                        onClick={() =>
                          void respond(request.follower_fursona_id, true)
                        }
                      >
                        Accept
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy !== null}
                        onClick={() =>
                          void respond(request.follower_fursona_id, false)
                        }
                      >
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {reviewHref && requests.length > 0 && requests.length <= 2 && (
          <Link
            href={reviewHref}
            onClick={() => setOpen(false)}
            className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground hover:bg-primary-dim"
          >
            Review follow requests
          </Link>
        )}
      </PopoverContent>
    </Popover>
  );
}
