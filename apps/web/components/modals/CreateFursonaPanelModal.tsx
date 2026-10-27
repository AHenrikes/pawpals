"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { TypographySmall } from "@repo/ui/typography";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@repo/ui/sonner";
import { usePageTransition } from "@/components/transitions/PageTransitionProvider";
import { useUser } from "@/providers/UserProvider";
import { api } from "@/lib/api/api-client";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import type { FursonaCreate, FursonaTypes } from "@/types/fursona";
import CreateFursona from "@/components/features/CreateFursona";

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
  const { navigate } = usePageTransition();
  const { switchCurrentFursona } = useUser();

  const [loading, setLoading] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [fursona, setFursona] = useState<FursonaCreate>({
    display_name: "",
    username: "",
    species: "",
    pronouns: "",
    bio: "",
  });

  if (!isOpen) return null;

  const handleFursonaChange = (field: keyof FursonaCreate, value: string) => {
    setFursona((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!fursona.display_name.trim()) {
      toast.error("Display name is required");
      return;
    }

    if (!fursona.username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (!isUsernameAvailable) {
      toast.error("Username is not available");
      return;
    }

    setLoading(true);

    try {
      const { fursona: createdFursona } = await api.post<{
        fursona: FursonaTypes;
      }>("/api/core/fursonas", fursona);

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

      navigate(`/@${createdFursona.username}`);
      toast.success(`Created ${createdFursona.display_name} successfully`);
    } catch {
      toast.error(ERROR_MESSAGES.FURSONA_CREATE_FAILED);
      return;
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
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      className="flex h-full items-end justify-center bg-black/50 p-2 sm:items-center sm:p-4"
    >
      <div className="relative max-h-[calc(100dvh-1rem)] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-background p-4 shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl sm:p-6">
        <Button
          variant="ghost"
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

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
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
