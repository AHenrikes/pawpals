"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Textarea } from "@repo/ui/textarea";
import {
  TypographyLead,
  TypographySmall,
  TypographyXSmall,
} from "@repo/ui/typography";
import type { FursonaTypesWithID } from "@/types/fursona";
import type { AccountTypesWithID } from "@/types/account";
import { X, AlertTriangle } from "lucide-react";

interface AdminPanelModalProps {
  fursona: FursonaTypesWithID;
  account?: AccountTypesWithID | null;
  isOpen: boolean;
  onClose: () => void;
  onSuspend: (reason: string) => Promise<void>;
  onDelete: (reason: string) => Promise<void>;
}

export function AdminPanelModal({
  fursona,
  account,
  isOpen,
  onClose,
  onSuspend,
  onDelete,
}: Readonly<AdminPanelModalProps>) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<"suspend" | "delete" | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!action || !reason.trim()) return;

    setLoading(true);
    try {
      if (action === "suspend") {
        await onSuspend(reason);
      } else {
        await onDelete(reason);
      }
      setReason("");
      setAction(null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-background p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <TypographyLead>Admin Panel</TypographyLead>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <TypographySmall>Fursona: {fursona.display_name}</TypographySmall>
          {account && (
            <TypographyXSmall className="text-muted-foreground">
              Account: {account.email}
            </TypographyXSmall>
          )}
        </div>

        {!action ? (
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setAction("suspend")}
              disabled={loading}
            >
              Suspend Account
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setAction("delete")}
              disabled={loading}
            >
              Delete Account
            </Button>
          </div>
        ) : (
          <>
            <Textarea
              placeholder="Reason for action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setAction(null);
                  setReason("");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant={action === "delete" ? "destructive" : "default"}
                className="flex-1"
                onClick={handleSubmit}
                disabled={loading || !reason.trim()}
              >
                {loading ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
