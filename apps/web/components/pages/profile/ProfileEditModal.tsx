"use client";

import { Dialog, DialogContent, DialogTitle } from "@repo/ui/dialog";
import SettingsPage from "@/components/pages/settings/SettingsPage";

type ProfileEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ProfileEditModal({
  isOpen,
  onClose,
}: Readonly<ProfileEditModalProps>) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="h-[min(92dvh,52rem)] max-h-[calc(100dvh-1rem)] w-[min(72rem,calc(100%-1rem))] max-w-none gap-0 overflow-hidden rounded-xl bg-background p-0 sm:max-h-[calc(100dvh-2rem)] sm:p-0"
      >
        <DialogTitle className="sr-only">Profile settings</DialogTitle>
        <SettingsPage initialSection="profile" onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
