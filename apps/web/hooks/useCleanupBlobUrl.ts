/**
 * Hook to safely cleanup blob URLs on component cleanup or when preview changes
 * Handles Safari edge cases and prevents memory leaks
 */
import { useEffect } from "react";

export function useCleanupBlobUrl(blobUrl: string | null) {
  useEffect(() => {
    return () => {
      if (!blobUrl?.startsWith("blob:")) return;
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Silently catch errors (e.g., Safari edge cases)
        // The object URL will still be cleaned up by GC
      }
    };
  }, [blobUrl]);
}
