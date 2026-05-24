"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Textarea } from "@repo/ui/textarea";
import type { FursonaTypesWithID } from "@/types/fursona";
import { X } from "lucide-react";

interface ReportProfileModalProps {
  fursona: FursonaTypesWithID;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
}

const REPORT_REASONS = [
  "Harassment or Bullying",
  "Inappropriate Content",
  "Impersonation",
  "Spam",
  "Sexual Content",
  "Hate Speech",
  "Dangerous or Illegal Activity",
  "Other",
];

export function ReportProfileModal({
  fursona,
  isOpen,
  onClose,
  onSubmit,
}: Readonly<ReportProfileModalProps>) {
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason || !details.trim()) {
      setError("Please select a reason and provide details");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(selectedReason, details);
      setSelectedReason(null);
      setDetails("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-background p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Report Profile</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Reporting: {fursona.display_name}
        </p>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason for Report
            </label>
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full rounded-md border p-2 text-left text-sm transition-colors ${
                    selectedReason === reason
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  }`}
                  disabled={loading}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="details" className="text-sm font-medium">
              Details
            </label>
            <Textarea
              placeholder="Please provide additional details about your report..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
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
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </div>
    </div>
  );
}
