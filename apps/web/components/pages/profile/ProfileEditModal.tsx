"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Textarea } from "@repo/ui/textarea";
import { uploadFursonaImage } from "@/lib/uploads/fursonaMedia";
import { useUser } from "@/providers/UserProvider";
import { useCleanupBlobUrl } from "@/hooks/useCleanupBlobUrl";
import { X, Camera, AtSignIcon, Loader2Icon, CheckIcon } from "lucide-react";
import { Dialog, DialogContent } from "@repo/ui/dialog";
import { useUsernameManager } from "@/hooks/core/fursonas/useUsernameManager";
import { useDebouncedCallback } from "use-debounce";
import { Label } from "@repo/ui/label";
import { useRouter } from "next/navigation";
import { type FursonaTypes } from "@/types/fursona";
import Image from "next/image";

interface EditProfileModalProps {
  fursona: FursonaTypes;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<FursonaTypes>) => Promise<void>;
}

export default function ProfileEditModal({
  fursona,
  isOpen,
  onClose,
  onSave,
}: Readonly<EditProfileModalProps>) {
  const router = useRouter();
  const { account, currentFursona, refresh } = useUser();
  const { checkAvailability, loading: usernameLoading } = useUsernameManager();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [species, setSpecies] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setDisplayName(fursona.display_name);
    setUsername(fursona.username);
    setBio(fursona.bio ?? "");
    setSpecies(fursona.species ?? "");
    setPronouns(fursona.pronouns ?? "");

    setAvatarPreview(fursona.avatar_url);
    setBannerPreview(fursona.banner_url);

    setAvatarFile(null);
    setBannerFile(null);
    setError(null);
  }, [fursona]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  useCleanupBlobUrl(avatarPreview);
  useCleanupBlobUrl(bannerPreview);

  const checkUsername = useDebouncedCallback(async (username: string) => {
    if (currentFursona?.username === username) return setIsAvailable(true);

    const res = await checkAvailability(username);
    setIsAvailable(res.available);
  }, 500);

  useEffect(() => {
    checkUsername(username);
  }, [checkUsername, username]);

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner",
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const maxSize = type === "banner" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        `${type === "banner" ? "Banner" : "Avatar"} must be under ${
          maxSize / 1024 / 1024
        }MB`,
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (type === "avatar") {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }

      setAvatarFile(file);
      setAvatarPreview(previewUrl);
      return;
    }

    if (bannerPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview);
    }

    setBannerFile(file);
    setBannerPreview(previewUrl);
  };

  const handleSave = async () => {
    if (!displayName.trim() || !username.trim()) {
      setError("Display name and username are required");
      return;
    }

    if (!account?.id) {
      setError("Account not loaded");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fursonaId = currentFursona?.id ?? fursona.id;

      const [avatarUrl, bannerUrl] = await Promise.all([
        avatarFile
          ? uploadFursonaImage(avatarFile, fursonaId, "fursona-avatars")
          : Promise.resolve(null),

        bannerFile
          ? uploadFursonaImage(bannerFile, fursonaId, "fursona-banners")
          : Promise.resolve(null),
      ]);

      await onSave({
        display_name: displayName.trim(),
        username: username.trim(),
        bio,
        species,
        pronouns,
        ...(avatarUrl && { avatar_url: avatarUrl }),
        ...(bannerUrl && { banner_url: bannerUrl }),
      });

      router.push(`/@${username}`);
      await refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !loading) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="w-full max-w-lg rounded-xl bg-background p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant={"ghost"}
          onClick={() => bannerInputRef.current?.click()}
          className="relative h-28 w-full overflow-hidden rounded-md bg-muted"
          disabled={loading}
        >
          {bannerPreview && (
            <Image
              src={bannerPreview}
              alt="Banner"
              fill
              quality={85}
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-cover"
            />
          )}

          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
            <Camera className="h-6 w-6 text-white" />
          </div>

          <Input
            ref={bannerInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleImageChange(e, "banner")}
          />
        </Button>

        <div className="-mt-10 ml-4">
          <Button
            type="button"
            variant={"ghost"}
            onClick={() => avatarInputRef.current?.click()}
            className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-background bg-muted"
            disabled={loading}
          >
            {avatarPreview && (
              <Image
                src={avatarPreview}
                alt="Avatar"
                fill
                quality={85}
                sizes="64px"
                className="object-cover"
              />
            )}

            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity hover:opacity-100">
              <Camera className="h-4 w-4 text-white" />
            </div>

            <Input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleImageChange(e, "avatar")}
            />
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fursona-displayName" variant={"muted"}>
            Display Name
          </Label>

          <Input
            id="fursona-displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="fursona-username" variant={"muted"}>
            Username
          </Label>

          <div className="relative">
            <AtSignIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="fursona-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-8 pr-8"
              error={isAvailable === false}
              required
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameLoading && (
                <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!usernameLoading && isAvailable === true && (
                <CheckIcon className="h-4 w-4 text-green-500" />
              )}
              {!usernameLoading && isAvailable === false && (
                <X className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="species" variant={"muted"}>
              Species
            </Label>

            <Input
              id="species"
              placeholder="Species"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pronouns" variant={"muted"}>
              Pronouns
            </Label>

            <Input
              id="pronouns"
              placeholder="Pronouns"
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <Textarea
          value={bio}
          rows={4}
          onChange={(e) => setBio(e.target.value)}
          disabled={loading}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={loading || isAvailable === false}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
