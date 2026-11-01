"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@repo/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/drawer";
import { Input } from "@repo/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/popover";
import { ArrowDownUpIcon, SearchIcon, UsersIcon, XIcon } from "lucide-react";
import { api } from "@/lib/api/api-client";
import { TypographySmall } from "@repo/ui/typography";
import FursonaAvatar from "@/components/avatar-icons/FursonaAvatar";
import Link from "next/link";

export type ConnectionTab =
  "followers" | "following" | "subscribers" | "requests" | "subscribed";
type Item = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  connectedAt: string;
  followsYou: boolean;
  followStatus: "accepted" | "pending" | null;
  isSelf: boolean;
};
type Result = { items: Item[]; hasMore: boolean };
const MAIN_TABS: ConnectionTab[] = ["followers", "following", "requests"];
const SUBSCRIPTION_TABS: ConnectionTab[] = ["subscribers", "subscribed"];

function followActionLabel(item: Item): string {
  if (item.followStatus === "accepted")
    return item.followsYou ? "Unfriend" : "Following";
  if (item.followStatus === "pending") return "Requested";
  return item.followsYou ? "Follow back" : "Follow";
}

export default function ProfileConnections({
  id,
  initialTab,
  isOwner,
  onProfileChange,
  onNavigate,
}: Readonly<{
  id: string;
  initialTab: ConnectionTab;
  isOwner: boolean;
  onProfileChange?: () => Promise<void>;
  onNavigate?: () => void;
}>) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ConnectionTab>(initialTab);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const latestRequest = useRef(0);
  const endpoint = `/api/core/fursonas/${id}/connections`;
  const listKey = JSON.stringify([tab, sort, searchTerm]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const nextSearch = query.trim().replace(/^@/, "");
      if (nextSearch === searchTerm) return;
      setItems([]);
      setPage(0);
      setHasMore(false);
      setError(null);
      setSearchTerm(nextSearch);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, searchTerm]);

  function changeTab(nextTab: ConnectionTab) {
    if (nextTab === tab) return;
    setItems([]);
    setPage(0);
    setHasMore(false);
    setError(null);
    setTab(nextTab);
  }

  function changeSort(nextSort: "newest" | "oldest") {
    if (nextSort === sort) return;
    setItems([]);
    setPage(0);
    setHasMore(false);
    setError(null);
    setSort(nextSort);
  }

  const load = useCallback(
    async (nextPage: number, signal?: AbortSignal) => {
      const requestId = ++latestRequest.current;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          tab,
          sort,
          page: String(nextPage),
        });
        if (searchTerm) params.set("search", searchTerm);
        const result = await api.get<Result>(`${endpoint}?${params}`, {
          signal,
        });
        if (signal?.aborted || requestId !== latestRequest.current) return;
        setItems((current) =>
          nextPage === 0 ? result.items : [...current, ...result.items],
        );
        setPage(nextPage);
        setHasMore(result.hasMore);
        setLoadedKey(listKey);
      } catch {
        if (!signal?.aborted && requestId === latestRequest.current)
          setError("Unable to load this list. Please try again.");
      } finally {
        if (!signal?.aborted && requestId === latestRequest.current)
          setLoading(false);
      }
    },
    [endpoint, listKey, searchTerm, sort, tab],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(0, controller.signal);
    return () => controller.abort();
  }, [load]);

  async function afterChange() {
    await Promise.all([
      load(0),
      onProfileChange
        ? onProfileChange()
        : queryClient.invalidateQueries({ queryKey: ["profile-counts", id] }),
    ]);
  }

  async function changeFollow(item: Item) {
    setBusy(item.id);
    setError(null);
    try {
      if (item.followStatus)
        await api.delete(`/api/core/fursonas/${item.id}/follow`);
      else await api.post(`/api/core/fursonas/${item.id}/follow`);
      await afterChange();
    } catch {
      setError("Unable to update follow status. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function removeFollower(item: Item) {
    setBusy(item.id);
    setError(null);
    try {
      await api.delete(endpoint, { followerId: item.id });
      await afterChange();
    } catch {
      setError("Unable to remove follower. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function respond(item: Item, accept: boolean) {
    setBusy(item.id);
    setError(null);
    try {
      await api.patch(`/api/core/fursonas/${id}/follow-requests`, {
        followerId: item.id,
        accept,
      });
      await afterChange();
    } catch {
      setError("Unable to update follow request. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const tabs = isOwner ? MAIN_TABS : MAIN_TABS.slice(0, 2);
  const searching = query.trim().replace(/^@/, "") !== searchTerm;
  const isCurrentList = !searching && loadedKey === listKey;
  const visibleItems = isCurrentList ? items : [];
  const visibleError = searching ? null : error;
  const showLoading = !visibleError && (searching || !isCurrentList || loading);
  const emptyListName = tab === "subscribed" ? "subscriptions" : tab;

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background text-text">
      {/* nav options */}
      <nav
        aria-label="Connection lists"
        className="flex items-center justify-between pt-2 border-b border-border/50 px-3 overflow-x-auto scrollbar-hide"
      >
        <div className="space-x-4">
          {tabs.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => changeTab(name)}
              aria-current={tab === name ? "page" : undefined}
              className={`shrink-0 px-2 py-3 text-sm border-b-2 capitalize transition-colors hover:cursor-pointer ${tab === name ? "border-primary font-semibold text-text" : "border-transparent text-text-muted hover:text-text"}`}
            >
              {name === "requests" ? "Requests" : name}
            </button>
          ))}
        </div>

        {isOwner && (
          <>
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Subscriptions"
                  className="shrink-0 md:hidden"
                >
                  <UsersIcon className="size-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="bg-background">
                <div className="mx-auto w-full max-w-md">
                  <DrawerHeader>
                    <DrawerTitle>Subscriptions</DrawerTitle>
                    <DrawerDescription>
                      Choose which subscription list to view.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="space-y-1 px-4 pb-6">
                    {SUBSCRIPTION_TABS.map((name) => (
                      <DrawerClose asChild key={name}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-between rounded-md ${tab === name ? "bg-surface" : ""}`}
                          onClick={() => changeTab(name)}
                        >
                          {name === "subscribers"
                            ? "Your subscribers"
                            : "Profiles you subscribe to"}
                        </Button>
                      </DrawerClose>
                    ))}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>

            <Popover
              open={subscriptionsOpen}
              onOpenChange={setSubscriptionsOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Subscriptions"
                  className="hidden shrink-0 md:inline-flex"
                >
                  <UsersIcon className="size-4" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                side="bottom"
                className="w-64 gap-1 p-2 bg-background rounded-md"
              >
                <TypographySmall className="pb-2 border-b border-border/30 text-text-muted">
                  Subscriptions
                </TypographySmall>

                {SUBSCRIPTION_TABS.map((name) => (
                  <Button
                    key={name}
                    variant="ghost"
                    onClick={() => {
                      changeTab(name);
                      setSubscriptionsOpen(false);
                    }}
                    className={`w-full justify-between rounded-sm ${tab === name ? "bg-surface" : ""}`}
                  >
                    {name === "subscribers"
                      ? "Your subscribers"
                      : "Profiles you subscribe to"}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          </>
        )}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Search */}
        <div className="relative min-w-0 flex-1 py-4 px-2">
          <SearchIcon
            aria-hidden="true"
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-muted"
          />

          <Input
            variant={"variant"}
            aria-label="Search connections"
            placeholder="Search name or @username"
            value={query}
            maxLength={50}
            onChange={(event) => setQuery(event.target.value)}
            className="pr-10 pl-9"
          />

          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex justify-between items-center py-2 px-2 border-t border-border/30">
          <TypographySmall>
            sorted by <b>{sort}</b>
          </TypographySmall>

          <Drawer>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Sort connections, ${sort} first`}
                className="md:hidden"
              >
                <ArrowDownUpIcon className="size-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-background">
              <div className="mx-auto w-full max-w-md">
                <DrawerHeader>
                  <DrawerTitle>Sort connections</DrawerTitle>
                  <DrawerDescription>
                    Choose the order for this list.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="space-y-1 px-4 pb-6">
                  {(["newest", "oldest"] as const).map((option) => (
                    <DrawerClose asChild key={option}>
                      <Button
                        variant="ghost"
                        onClick={() => changeSort(option)}
                        className={`w-full justify-between rounded-md ${sort === option ? "bg-surface" : ""}`}
                      >
                        {option === "newest" ? "Newest first" : "Oldest first"}
                      </Button>
                    </DrawerClose>
                  ))}
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          <Popover open={sortOpen} onOpenChange={setSortOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Sort connections, ${sort} first`}
                className="hidden md:inline-flex"
              >
                <ArrowDownUpIcon className="size-4" />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              side="bottom"
              className="w-56 gap-1 p-2 bg-background rounded-md"
            >
              <TypographySmall className="pb-2 text-text-muted border-b border-border/30">
                Sort connections
              </TypographySmall>

              {(["newest", "oldest"] as const).map((option) => (
                <Button
                  key={option}
                  variant="ghost"
                  onClick={() => {
                    changeSort(option);
                    setSortOpen(false);
                  }}
                  className={`w-full justify-between rounded-sm ${sort === option ? "bg-surface" : ""}`}
                >
                  {option === "newest" ? "Newest first" : "Oldest first"}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        <div className="px-2">
          {/* subscription drawer nav */}
          {SUBSCRIPTION_TABS.includes(tab) && (
            <h2 className="pb-1 text-sm font-semibold">
              {tab === "subscribers"
                ? "Your subscribers"
                : "Profiles you subscribe to"}
            </h2>
          )}

          {/* error */}
          {visibleError && (
            <div role="alert" className="py-3 text-sm text-destructive">
              {visibleError}{" "}
              <Button
                variant="outline"
                size="sm"
                onClick={() => void load(page)}
              >
                Retry
              </Button>
            </div>
          )}

          {/* no match */}
          {!showLoading && !visibleError && visibleItems.length === 0 && (
            <p className="py-12 text-center text-sm text-text-muted">
              {searchTerm
                ? "No matching users found."
                : `No ${emptyListName} yet.`}
            </p>
          )}

          {/* results/users */}
          {visibleItems.map((item) => {
            const label = followActionLabel(item);

            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-3 px-2 rounded-md border-b border-border/30 last:border-0 hover:bg-surface"
              >
                <Link
                  href={`/@${item.username}`}
                  onClick={onNavigate}
                  className="flex min-w-0 flex-1 items-center gap-3 py-4 hover:opacity-80"
                >
                  <FursonaAvatar
                    className="size-11 shrink-0"
                    name={item.displayName}
                    src={item.avatarUrl}
                    alt=""
                  />

                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {item.displayName}
                    </span>

                    <span className="block truncate text-sm text-text-muted">
                      @{item.username}
                    </span>
                  </span>
                </Link>

                {tab === "requests" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={busy === item.id}
                      onClick={() => void respond(item, true)}
                    >
                      Accept
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === item.id}
                      onClick={() => void respond(item, false)}
                    >
                      Decline
                    </Button>
                  </div>
                ) : (
                  !item.isSelf && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={item.followStatus ? "outline" : "default"}
                        disabled={busy === item.id}
                        title={
                          item.followStatus
                            ? "Click to unfollow or cancel request"
                            : undefined
                        }
                        onClick={() => void changeFollow(item)}
                      >
                        {label}
                      </Button>

                      {isOwner && tab === "followers" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy === item.id}
                          onClick={() => void removeFollower(item)}
                          className="p-2"
                        >
                          X
                        </Button>
                      )}
                    </div>
                  )
                )}
              </div>
            );
          })}

          {/* searching */}
          {showLoading && (
            <output className="block py-8 text-center text-sm text-text-muted">
              Loading connections…
            </output>
          )}

          {/* more button */}
          {!showLoading && hasMore && (
            <div className="py-4 text-center">
              <Button variant="outline" onClick={() => void load(page + 1)}>
                Load more
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
