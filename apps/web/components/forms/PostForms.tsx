"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AtSignIcon, BadgeCheckIcon, GlobeIcon,
  MapPinIcon, UserPlusIcon,
  SmileIcon, SparklesIcon, XIcon, PlusIcon, SendIcon,
  ChevronRightIcon, ChevronDownIcon, UsersIcon,
  HashIcon, ImageIcon,
} from "lucide-react"
import { useUser } from "@/providers/UserProvider"
import { cn } from "@/lib/helpers/utils"
import {
  usePostForm,
  type Visibility,
  POST_MAX_MEDIA,
  POST_MAX_CHARS,
  POST_WARN_CHARS,
  POST_DANGER_CHARS,
} from "@/hooks/social/posts/usePostForm"
import Image from "next/image"
import { toast } from "@repo/ui/sonner"

// ─── Static config ────────────────────────────────────────────────────────────
const VISIBILITY_OPTIONS: { value: Visibility; label: string; Icon: React.ElementType }[] = [
  { value: "everyone",  label: "Everyone",       Icon: GlobeIcon },
  { value: "verified",  label: "Verified only",  Icon: BadgeCheckIcon },
  { value: "followers", label: "Followers only", Icon: UsersIcon },
  { value: "mutuals",   label: "Mutuals only",   Icon: UserPlusIcon },
  { value: "mentioned", label: "Mentioned users",Icon: AtSignIcon },
]

const META_ROWS: { Icon: React.ElementType; label: string }[] = [
  { Icon: MapPinIcon,   label: "Add location" },
  { Icon: UserPlusIcon, label: "Tag people" },
  { Icon: HashIcon,     label: "Add tags" },
]

const TOOLBAR_ACTIONS: { Icon: React.ElementType; label: string }[] = [
  { Icon: SmileIcon,    label: "Emoji" },
  { Icon: AtSignIcon,   label: "Tag someone" },
  { Icon: SparklesIcon, label: "AI assist" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCharClass(used: number) {
  if (used > POST_DANGER_CHARS) return "text-destructive"
  if (used > POST_WARN_CHARS)   return "text-amber-400"
  return "text-muted-foreground"
}

// ─── MediaGrid ────────────────────────────────────────────────────────────────
interface MediaGridProps {
  previews: string[]
  onRemove: (i: number) => void
  onAdd: () => void
}

function MediaGrid({ previews, onRemove, onAdd }: Readonly<MediaGridProps>) {
  const count = previews.length

  const containerClass = cn(
    "flex-1 p-2.5 gap-1 content-start h-[calc(100%-33px)]",
    count === 1 && "grid grid-cols-1",
    count === 2 && "grid grid-rows-2",
    count === 3 && "grid grid-cols-2 grid-rows-2",
    count === 4 && "grid grid-cols-2 grid-rows-2",
    count === 5 && "grid grid-cols-2 grid-rows-4",
  )

  const itemClass = (i: number) =>
    cn(
      "group relative overflow-hidden bg-surface-highest w-full h-full aspect-[1/2]",
      count === 3 && i === 0 && "row-span-2",
      count === 5 && i === 0 && "row-span-4",
    )

  return (
    <div className={containerClass}>
      {previews.map((src, i) => (
        <div key={src} className={itemClass(i)}>
          <Image src={src} alt={`Media ${i + 1}`} fill quality={100} className="object-cover" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label={`Remove media ${i + 1}`}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-sm bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/90"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
      ))}

      <div className="block lg:hidden">
        {count < POST_MAX_MEDIA && (
          <button
            type="button"
            onClick={onAdd}
            className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-primary hover:bg-primary/5"
            aria-label="Add more media"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add more</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Mobile media strip (thumbnail row shown below caption on small screens) ──
interface MobileMediaStripProps {
  previews: string[]
  onRemove: (i: number) => void
  onAdd: () => void
}

function MobileMediaStrip({ previews, onRemove, onAdd }: Readonly<MobileMediaStripProps>) {
  return (
    <div className="flex gap-2 w-full overflow-x-auto px-4 py-2 scrollbar-none">
      {previews.map((src, i) => (
        <div
          key={src}
          className="group relative flex-shrink-0 overflow-hidden rounded-lg bg-surface-highest aspect-square"
        >
          <Image
            src={src}
            alt={`Media ${i + 1}`}
            fill quality={90}
            className="object-cover"
          />

          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label={`Remove media ${i + 1}`}
            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <XIcon className="h-2.5 w-2.5" />
          </button>
        </div>
      ))}

      {previews.length < POST_MAX_MEDIA && (
        <button
          type="button"
          onClick={onAdd}
          className="h-full w-full rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-0.5 text-muted-foreground text-[10px] hover:border-primary hover:text-primary transition-colors"
          aria-label="Add media"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add</span>
        </button>
      )}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface PostFormProps {
  placeholder?: string
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PostForm({
  placeholder = "Write a caption...",
  onClose,
}: Readonly<PostFormProps>) {
  const { currentFursona, account } = useUser()
  const {
    content, setContent,
    mediaPreviews,
    isNSFW, toggleNSFW,
    visibility, setVisibility,
    loading,
    mediaRef,
    addMedia,
    removeMedia,
    handleSubmit,
  } = usePostForm(onClose)

  const [visOpen, setVisOpen] = useState(false)
  
  if (!account) {
    toast.error("Could not identify account")
    return null
  };

  if (!currentFursona?.id) {
    toast.error("Could not post at this time, please try refreshing")
    return null
  };

  const currentVis = VISIBILITY_OPTIONS.find(o => o.value === visibility) ?? VISIBILITY_OPTIONS[0]
  if (!currentVis) {
    return null;
  }

  const openFilePicker = () => mediaRef.current?.click()

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSubmit(account.id, currentFursona.id) }}
      className={cn(
        // Mobile: single column. Desktop: side-by-side.
        "flex flex-col lg:grid h-full w-full overflow-hidden rounded-[22px] border transition-colors duration-300",
        "border-border",
        isNSFW && "border-destructive",
      )}
      style={{ gridTemplateColumns: "1fr 400px" }}
    >
      {/* ── LEFT: media panel (desktop only) ── */}
      <div className="hidden lg:flex relative flex-col h-[70svh] border-r border-border">
        {mediaPreviews.length === 0 ? (
          <motion.button
            type="button"
            onClick={openFilePicker}
            whileHover={{ backgroundColor: "hsla(270,40%,50%,.05)" }}
            className="flex flex-1 flex-col items-center justify-center gap-3 p-8 cursor-pointer"
            aria-label="Upload media"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-primary/10 text-primary transition-colors">
              <PlusIcon className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Drag photos and videos here
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                or click to browse from your device<br />Up to {POST_MAX_MEDIA} files
              </p>
            </div>
          </motion.button>
        ) : (
          <MediaGrid previews={mediaPreviews} onRemove={removeMedia} onAdd={openFilePicker} />
        )}

        {mediaPreviews.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">{mediaPreviews.length}</span> / {POST_MAX_MEDIA} files
            </span>
            {mediaPreviews.length < POST_MAX_MEDIA && (
              <button
                type="button"
                onClick={openFilePicker}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-75 transition-opacity"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add more
              </button>
            )}
          </div>
        )}

        <input
          ref={mediaRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => { addMedia(Array.from(e.target.files ?? [])); e.target.value = "" }}
          className="hidden"
        />
      </div>

      {/* ── RIGHT / MOBILE: caption panel ── */}
      <div className="flex flex-col min-h-0 flex-1 lg:flex-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            {currentFursona?.avatar_url && (
              <div className="relative h-9 w-9 overflow-hidden rounded-full flex-shrink-0">
                <Image src={currentFursona.avatar_url} alt={currentFursona.username ?? ""} fill className="object-cover" />
              </div>
            )}
            <div>
              <p className="text-sm font-bold leading-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {currentFursona?.display_name}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                Creating new post
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleNSFW}
              aria-pressed={isNSFW}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-widest transition-all",
                isNSFW
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive/70",
              )}
            >
              NSFW
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-surface-variant hover:text-foreground"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile: media strip appears under header */}
        <div className="flex h-24 lg:hidden border-b border-border">
          {mediaPreviews.length > 0 ? (
            <MobileMediaStrip previews={mediaPreviews} onRemove={removeMedia} onAdd={openFilePicker} />
          ) : (
            <button
              type="button"
              onClick={openFilePicker}
              className="flex w-full items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ImageIcon className="h-6 w-6" />
              Add photos or videos
            </button>
          )}
        </div>

        {/* Hidden file input (shared, used by both desktop + mobile triggers) */}
        <input
          ref={mediaRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => { addMedia(Array.from(e.target.files ?? [])); e.target.value = "" }}
          className="hidden"
        />

        {/* Caption + meta — scrollable on mobile */}
        <div className="flex flex-1 flex-col overflow-y-auto min-h-0 border-b border-border">
          <div className="flex flex-col flex-1 pt-3 gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              maxLength={POST_MAX_CHARS}
              // fewer rows on mobile so meta rows are visible without scrolling
              rows={4}
              className="w-full flex-1 px-4 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground outline-none"
              style={{ caretColor: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
            />

            <div className="flex justify-end px-4">
              <span className={cn("rounded-full bg-surface-highest px-2.5 py-0.5 text-[11px]", getCharClass(content.length))}>
                {content.length} / {POST_MAX_CHARS}
              </span>
            </div>

            {/* Meta rows */}
            <div className="flex flex-col border-t border-border px-4">
              {META_ROWS.map(({ Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-none text-muted-foreground hover:opacity-70 transition-opacity"
                >
                  <span className="flex items-center gap-2.5 text-sm" style={{ fontFamily: "var(--font-body)" }}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between px-4 pb-3">
              <span className="text-xs text-muted-foreground">Who can see this?</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setVisOpen(v => !v)}
                  aria-expanded={visOpen}
                  aria-haspopup="listbox"
                  className="flex items-center gap-1.5 rounded-full border border-border bg-surface-highest px-2.5 py-1 text-xs text-foreground transition-colors hover:border-primary"
                >
                  <currentVis.Icon className="h-3 w-3" />
                  {currentVis.label}
                  <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
                </button>

                <AnimatePresence>
                  {visOpen && (
                    <motion.ul
                      role="listbox"
                      aria-label="Visibility"
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      // on mobile open upward so it doesn't go off-screen
                      className="absolute right-0 bottom-full lg:top-full lg:bottom-auto z-30 mb-1.5 lg:mb-0 lg:mt-1.5 w-48 overflow-hidden rounded-2xl border border-border bg-surface-highest shadow-lg"
                    >
                      {VISIBILITY_OPTIONS.map(({ value, label, Icon }) => (
                        <li key={value} role="option" aria-selected={visibility === value}>
                          <button
                            type="button"
                            onClick={() => { setVisibility(value); setVisOpen(false) }}
                            className={cn(
                              "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors hover:bg-surface-variant",
                              visibility === value ? "text-primary" : "text-muted-foreground",
                            )}
                            style={{ fontFamily: "var(--font-body)" }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Footer toolbar */}
        <div className="flex flex-col gap-2 px-4 pb-4 pt-3">
          <div className="flex items-center gap-1">
            {TOOLBAR_ACTIONS.map(({ Icon, label }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-variant hover:text-primary"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <div className="flex-1" />
          </div>

          <button
            type="submit"
            disabled={loading || (!content.trim() && mediaPreviews.length === 0)}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-2xl py-2.5",
              "bg-primary text-primary-foreground font-bold text-sm",
              "transition-all hover:bg-primary-dim active:scale-[.98]",
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
                <SendIcon className="h-4 w-4" />
                Post
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
