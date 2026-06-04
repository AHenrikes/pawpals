"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { TypographySmall } from "@repo/ui/typography";
import type { FursonaTypes } from "@/types/fursona";
import { X } from "lucide-react";
import CreateFursona from "@/components/features/CreateFursona";
import { motion } from "framer-motion";
import { toast } from "@repo/ui/sonner";
import { FormError } from "@repo/ui/form-error";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";

interface CreateFursonaPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateFursonaPanelModal({
  isOpen,
  onClose,
  onSuccess,
}: Readonly<CreateFursonaPanelModalProps>) {
  const router = useRouter();
  const { switchCurrentFursona } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [fursona, setFursona] = useState<FursonaTypes>({
    display_name: "",
    username: "",
    species: "",
    pronouns: "",
    bio: "",
  });

  if (!isOpen) return null;

  const handleFursonaChange = (field: keyof FursonaTypes, value: string) => {
    setFursona((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCreate = async () => {
    if (!fursona.display_name.trim()) {
      setError("Display name is required");
      return;
    }

    if (!fursona.username.trim()) {
      setError("Username is required");
      return;
    }

    if (!isUsernameAvailable) {
      setError("Username is not available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/core/fursonas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fursona),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create fursona");
      }

      const data = await response.json();
      const createdFursona = data.fursona;

      // Switch to the newly created fursona
      await switchCurrentFursona(createdFursona.id);

      onSuccess?.();
      onClose();
      setFursona({
        display_name: "",
        username: "",
        species: "",
        pronouns: "",
        bio: "",
      });

      router.push(`/@${createdFursona.username}`);
      toast.success(`Created ${createdFursona.display_name} successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fursona");
      toast.error(
        err instanceof Error ? err.message : "Failed to create fursona",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFursona({
        display_name: "",
        username: "",
        species: "",
        pronouns: "",
        bio: "",
      });
      setError(null);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      className="flex items-center justify-center h-full bg-black/50"
    >
      <div className="relative w-full max-w-[640px] mx-4 rounded-lg bg-background p-6 shadow-lg max-h-[90vh]">
        <Button
          variant={"none"}
          onClick={handleClose}
          disabled={loading}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-popover disabled:opacity-50"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>

        <div className="mb-6">
          <TypographySmall className="font-semibold">
            Create New Fursona
          </TypographySmall>
        </div>

        <div className="mb-6">
          <CreateFursona
            fursona={fursona}
            onFursonaChange={handleFursonaChange}
            isActive={isOpen}
            onUsernameAvailability={setIsUsernameAvailable}
          />
        </div>

        {error && (
          <div className="mb-4">
            <FormError message={error} />
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>

          <Button
            onClick={handleCreate}
            disabled={loading || !isUsernameAvailable}
            className="flex-1"
          >
            {loading ? "Creating..." : "Create Fursona"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
