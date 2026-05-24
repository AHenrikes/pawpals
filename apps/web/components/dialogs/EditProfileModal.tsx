"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Textarea } from "@repo/ui/textarea";
import { TypographySmall } from "@repo/ui/typography";
import type { FursonaTypesWithID } from "@/types/fursona";
import { X } from "lucide-react";

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

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!displayName.trim() || !username.trim()) {
      setError("Display name and username are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave({
        display_name: displayName,
        username,
        bio,
        species,
        pronouns,
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
          <TypographySmall className="font-bold">Edit Profile</TypographySmall>
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

          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              Display Name
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="species" className="text-sm font-medium">
                Species
              </label>
              <Input
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="pronouns" className="text-sm font-medium">
                Pronouns
              </label>
              <Input
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
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
