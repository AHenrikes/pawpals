"use client";

import { useState, useRef } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Textarea } from "@repo/ui/textarea";
import { TypographySmall } from "@repo/ui/typography";
import type { FursonaTypesWithID } from "@/types/fursona";
import { X, Camera } from "lucide-react";
import { uploadFursonaImage } from "@/lib/uploads/fursonaMedia"; // your upload fn from before
import Image from "next/image";

interface EditProfileModalProps {
  fursona: FursonaTypesWithID;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<FursonaTypesWithID>) => Promise<void>;
}

export function EditProfileModal({
  fursona,
  isOpen,
  onClose,
  onSave,
}: Readonly<EditProfileModalProps>) {
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(fursona.display_name);
  const [username, setUsername] = useState(fursona.username);
  const [bio, setBio] = useState(fursona.bio || "");
  const [species, setSpecies] = useState(fursona.species || "");
  const [pronouns, setPronouns] = useState(fursona.pronouns || "");
  const [error, setError] = useState<string | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    fursona.avatar_url ?? null,
  );
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    fursona.banner_url ?? null,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    if (type === "avatar") {
      setAvatarFile(file);
      setAvatarPreview(preview);
    } else {
      setBannerFile(file);
      setBannerPreview(preview);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim() || !username.trim()) {
      setError("Display name and username are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload images first if changed
      const [newAvatarUrl, newBannerUrl] = await Promise.all([
        avatarFile
          ? uploadFursonaImage(
              avatarFile,
              fursona.account_id,
              fursona.id,
              "fursona-avatars",
            )
          : Promise.resolve(null),
        bannerFile
          ? uploadFursonaImage(
              bannerFile,
              fursona.account_id,
              fursona.id,
              "fursona-banners",
            )
          : Promise.resolve(null),
      ]);

      await onSave({
        display_name: displayName,
        username,
        bio,
        species,
        pronouns,
        ...(newAvatarUrl && { avatar_url: newAvatarUrl }),
        ...(newBannerUrl && { banner_url: newBannerUrl }),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-background p-6">
        <div className="flex items-center justify-between">
          <TypographySmall className="font-bold">Edit Fursona</TypographySmall>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Banner */}
          <div
            className="relative h-28 w-full cursor-pointer overflow-hidden rounded-md bg-muted"
            onClick={() => !loading && bannerInputRef.current?.click()}
          >
            {bannerPreview && (
              <Image
                src={bannerPreview}
                alt="Banner"
                quality={100}
                fill
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={(e) => handleImageChange(e, "banner")}
            />
          </div>

          {/* Avatar — overlapping the banner */}
          <div className="-mt-10 ml-4">
            <div
              className="relative h-16 w-16 cursor-pointer overflow-hidden rounded-full border-2 border-background bg-muted"
              onClick={() => !loading && avatarInputRef.current?.click()}
            >
              {avatarPreview && (
                <Image
                  src={avatarPreview}
                  alt="Avatar"
                  quality={100}
                  fill
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                <Camera className="h-4 w-4 text-white" />
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={(e) => handleImageChange(e, "avatar")}
              />
            </div>
          </div>

          {/* Rest of fields unchanged */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Species</label>
              <Input
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pronouns</label>
              <Input
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
