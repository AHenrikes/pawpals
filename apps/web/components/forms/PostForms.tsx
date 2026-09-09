"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AtSignIcon,
  BadgeCheckIcon,
  GlobeIcon,
  MapPinIcon,
  UserPlusIcon,
  SmileIcon,
  SparklesIcon,
  XIcon,
  PlusIcon,
  SendIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  HashIcon,
  ImageIcon,
} from "lucide-react";
import { useUser } from "@/providers/UserProvider";
import { cn } from "@/lib/helpers/utils";
import {
  usePostForm,
  type Visibility,
  POST_MAX_MEDIA,
  POST_MAX_CHARS,
  POST_WARN_CHARS,
  POST_DANGER_CHARS,
} from "@/hooks/core/fursonas/usePostForm";
import Image from "next/image";
import { toast } from "@repo/ui/sonner";
import { type MediaItem } from "@/types/post";
import { Button } from "@repo/ui/button";
import { TypographyP, TypographySmall } from "@repo/ui/typography";
import { Input } from "@repo/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { getOrderedVisible } from "@/lib/mediaLayout";
import { type MediaWithOrientation } from "@/lib/mediaLayout";

const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  Icon: React.ElementType;
}[] = [
  { value: "public", label: "Everyone", Icon: GlobeIcon },
  { value: "followers", label: "Followers", Icon: BadgeCheckIcon },
  { value: "mutuals", label: "Mutuals", Icon: UserPlusIcon },
  { value: "private", label: "Private", Icon: AtSignIcon },
];

const META_ROWS: { Icon: React.ElementType; label: string }[] = [
  { Icon: MapPinIcon, label: "Add location" },
  { Icon: UserPlusIcon, label: "Tag people" },
  { Icon: HashIcon, label: "Add tags" },
];

const TOOLBAR_ACTIONS: { Icon: React.ElementType; label: string }[] = [
  { Icon: SmileIcon, label: "Emoji" },
  { Icon: AtSignIcon, label: "Tag someone" },
  { Icon: SparklesIcon, label: "AI assist" },
];

function getCharClass(used: number) {
  if (used > POST_DANGER_CHARS) return "text-destructive";
  if (used > POST_WARN_CHARS) return "text-amber-400";
  return "text-muted-foreground";
}

// ─── Shared media item renderer ───────────────────────────────────────────────
function MediaItem({
  preview,
  displayIndex,
  onRemove,
  className,
}: Readonly<{
  preview: MediaWithOrientation;
  displayIndex: number;
  onRemove: (i: number) => void;
  className?: string;
}>) {
  return (
    <div className={cn("group relative overflow-hidden bg-black", className)}>
      {preview.media_type === "video" ? (
        <video
          src={preview.url}
          className="w-full h-full object-cover"
          muted
          playsInline
          loop
          autoPlay
        />
      ) : (
        <Image
          src={preview.url}
          alt={`Media ${displayIndex + 1}`}
          width={preview.width}
          height={preview.height}
          quality={85}
          className="object-cover w-full h-full"
        />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <Button
        type="button"
        variant={"destructive"}
        size={"icon"}
        // preview.originalIndex, not displayIndex — removeMedia needs the index
        // in the *original* mediaPreviews array, since layout reorders items.
        onClick={() => onRemove(preview.originalIndex)}
        aria-label={`Remove media ${displayIndex + 1}`}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-all group-hover:opacity-100 hover:bg-black hover:scale-110"
      >
        <XIcon className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ─── Desktop media grid with real dimensions ──────────────────────────────────
function MediaGrid({
  previews,
  onRemove,
}: Readonly<{
  previews: MediaItem[];
  onRemove: (i: number) => void;
  onAdd: () => void;
}>) {
  const { visible, container, img } = getOrderedVisible(
    previews,
    POST_MAX_MEDIA,
  );

  return (
    <div className="flex items-center h-full overflow-hidden">
      <div
        className={`relative ${container} w-full max-w-360 max-h-[60svh] bg-black/50 overflow-hidden`}
      >
        {visible.map((item, index) => (
          <MediaItem
            key={`${item.originalIndex}`}
            preview={item}
            displayIndex={index}
            onRemove={onRemove}
            className={img[index] ?? ""}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Mobile strip ─────────────────────────────────────────────────────────────
function MobileMediaStrip({
  previews,
  onRemove,
  onAdd,
}: Readonly<{
  previews: MediaItem[];
  onRemove: (i: number) => void;
  onAdd: () => void;
}>) {
  return (
    <div className="flex gap-2 w-full overflow-x-auto px-4 py-2 scrollbar-none items-center">
      {previews.map((p, i) => (
        <div
          key={p.url}
          className="group relative shrink-0 overflow-hidden rounded-xl bg-black"
          style={{ width: 72, height: 72 }}
        >
          {p.media_type === "video" ? (
            <video
              src={p.url}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            <Image
              src={p.url}
              alt={`Media ${i + 1}`}
              fill
              sizes="72px"
              quality={90}
              className="object-cover"
            />
          )}
          <Button
            type="button"
            size={"icon"}
            variant={"outline"}
            onClick={() => onRemove(i)}
            aria-label={`Remove media ${i + 1}`}
            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <XIcon className="h-2.5 w-2.5" />
          </Button>
        </div>
      ))}

      {previews.length < POST_MAX_MEDIA && (
        <Button
          type="button"
          size={"icon"}
          variant={"ghost"}
          onClick={onAdd}
          style={{ width: 72, height: 72 }}
          className="shrink-0 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-0.5 text-muted-foreground text-[10px] hover:border-primary hover:text-primary transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add</span>
        </Button>
      )}
    </div>
  );
}

interface PostFormProps {
  placeholder?: string;
  onClose: () => void;
}

export default function PostForm({
  placeholder = "Write a caption...",
  onClose,
}: Readonly<PostFormProps>) {
  const { currentFursona, account } = useUser();
  const {
    content,
    setContent,
    mediaPreviews,
    isNSFW,
    toggleNSFW,
    visibility,
    setVisibility,
    loading,
    mediaRef,
    addMedia,
    removeMedia,
    handleSubmit,
  } = usePostForm(onClose);

  const [visOpen, setVisOpen] = useState(false);

  if (!account) {
    toast.error("Could not identify account");
    return null;
  }
  if (!currentFursona?.id) {
    toast.error("Could not post at this time, please try refreshing");
    return null;
  }

  const currentVis =
    VISIBILITY_OPTIONS.find((o) => o.value === visibility) ??
    VISIBILITY_OPTIONS[0];
  if (!currentVis) return null;

  const openFilePicker = () => mediaRef.current?.click();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(account.id, currentFursona.id);
      }}
      className={cn(
        "flex flex-col lg:grid h-full w-full overflow-hidden rounded-[22px] border transition-colors duration-300",
        isNSFW ? "border-destructive" : "border-border",
      )}
      style={{ gridTemplateColumns: "1fr 400px" }}
    >
      {/* ── LEFT: media panel (desktop) ── */}
      <div className="hidden lg:flex relative flex-col h-[70svh] border-r border-border bg-black/2">
        {mediaPreviews.length === 0 ? (
          <motion.button
            type="button"
            onClick={openFilePicker}
            whileHover={{ backgroundColor: "hsla(270,40%,50%,.05)" }}
            className="flex flex-1 flex-col items-center justify-center gap-3 p-8 cursor-pointer"
            aria-label="Upload media"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-primary/10 text-primary">
              <PlusIcon className="h-6 w-6" />
            </div>

            <div className="flex flex-col text-center">
              <TypographySmall
                className="font-semibold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Drag photos and videos here
              </TypographySmall>

              <TypographySmall className="mt-1 text-muted-foreground leading-relaxed">
                or click to browse from your device
                <br />
                Up to {POST_MAX_MEDIA} files
              </TypographySmall>
            </div>
          </motion.button>
        ) : (
          <MediaGrid
            previews={mediaPreviews}
            onRemove={removeMedia}
            onAdd={openFilePicker}
          />
        )}

        {mediaPreviews.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">
                {mediaPreviews.length}
              </span>{" "}
              / {POST_MAX_MEDIA} files
            </span>

            {mediaPreviews.length < POST_MAX_MEDIA && (
              <Button
                type="button"
                size={"icon"}
                variant={"ghost"}
                onClick={openFilePicker}
                className="w-fit gap-1 text-xs font-medium text-primary hover:opacity-75 transition-opacity"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add more
              </Button>
            )}
          </div>
        )}

        <Input
          ref={mediaRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => {
            addMedia(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {/* ── RIGHT / MOBILE: caption panel ── */}
      <div className="flex flex-col min-h-0 flex-1 lg:flex-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            {currentFursona?.avatar_url && (
              <div className="relative h-9 w-9 overflow-hidden rounded-full shrink-0">
                <Image
                  src={currentFursona.avatar_url}
                  alt={currentFursona.username ?? ""}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
            )}

            <div>
              <TypographySmall
                className="font-bold leading-tight text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {currentFursona?.display_name}
              </TypographySmall>

              <TypographyP className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                Creating new post
              </TypographyP>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={"outline"}
              onClick={toggleNSFW}
              aria-pressed={isNSFW}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-widest transition-all hover:border-red-600",
                isNSFW
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive/70",
              )}
            >
              NSFW
            </Button>

            <Button
              type="button"
              size={"icon"}
              variant={"destructive"}
              onClick={onClose}
              aria-label="Close"
              className="p-1.5"
            >
              <XIcon size={18} />
            </Button>
          </div>
        </div>

        {/* Mobile: media strip */}
        <div
          className="flex lg:hidden border-b border-border"
          style={{ minHeight: 88 }}
        >
          {mediaPreviews.length > 0 ? (
            <MobileMediaStrip
              previews={mediaPreviews}
              onRemove={removeMedia}
              onAdd={openFilePicker}
            />
          ) : (
            <Button
              type="button"
              size={"icon"}
              variant={"ghost"}
              onClick={openFilePicker}
              className="w-full h-full gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ImageIcon className="h-5 w-5" />
              Add photos or videos
            </Button>
          )}
        </div>

        <Input
          ref={mediaRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => {
            addMedia(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
          className="hidden"
        />

        {/* Caption + meta */}
        <div className="flex flex-col h-full gap-2 border-b border-border">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            maxLength={POST_MAX_CHARS}
            rows={4}
            className="w-full flex-1 px-4 py-2 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground outline-hidden"
            style={{
              caretColor: "hsl(var(--primary))",
              fontFamily: "var(--font-body)",
            }}
          />

          <div className="flex justify-end px-4">
            <span
              className={cn(
                "rounded-full bg-surface-highest px-2.5 py-0.5 text-[11px]",
                getCharClass(content.length),
              )}
            >
              {content.length} / {POST_MAX_CHARS}
            </span>
          </div>

          <div className="flex flex-col border-t border-border px-4 py-2">
            {META_ROWS.map(({ Icon, label }) => (
              <Button
                type="button"
                key={label}
                size={"icon"}
                variant={"ghost"}
                className="w-full text-muted-foreground hover:opacity-70 transition-opacity"
              >
                <span
                  className="flex items-center w-full gap-2.5 text-sm"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <Icon size={16} />
                  {label}
                </span>

                <ChevronRightIcon size={14} />
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between px-4 pb-3">
            <span className="text-xs text-muted-foreground">
              Who can see this?
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size={"icon"}
                  variant={"outline"}
                  onClick={() => setVisOpen((v) => !v)}
                  aria-expanded={visOpen}
                  aria-haspopup="listbox"
                  className="px-3 py-1 gap-3 text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-1.5">
                    <currentVis.Icon size={12} />
                    {currentVis.label}
                  </div>

                  <ChevronDownIcon size={12} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                {visOpen && (
                  <DropdownMenuGroup>
                    {VISIBILITY_OPTIONS.map(({ value, label, Icon }) => (
                      <DropdownMenuItem
                        key={value}
                        role="option"
                        aria-selected={visibility === value}
                      >
                        <Button
                          type="button"
                          size={"icon"}
                          variant={"ghost"}
                          onClick={() => {
                            setVisibility(value);
                            setVisOpen(false);
                          }}
                          className={cn(
                            "justify-start w-full h-full px-2.5 py-3 gap-1.5 text-sm text-muted-foreground rounded-none transition-colors hover:bg-surface-variant",
                            visibility === value
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        >
                          <Icon size={16} />

                          {label}
                        </Button>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 px-4 pb-4 pt-3">
          <div className="flex items-center gap-1">
            {TOOLBAR_ACTIONS.map(({ Icon, label }) => (
              <Button
                key={label}
                aria-label={label}
                type="button"
                size={"icon"}
                variant={"ghost"}
                className="p-2 text-muted-foreground transition-colors hover:bg-surface-variant hover:text-primary"
              >
                <Icon size={16} />
              </Button>
            ))}
          </div>

          <Button
            type="submit"
            size={"icon"}
            disabled={
              loading || (!content.trim() && mediaPreviews.length === 0)
            }
            className={cn(
              "w-full py-2",
              "disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100",
            )}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                />
                Posting…
              </>
            ) : (
              <>
                <SendIcon size={14} />
                Post
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
