"use client"

import { useCallback, useState } from "react";

interface UsernameAvailability {
  available: boolean;
  username?: string;
  error?: string;
}

/**
 * Hook for managing username operations (checking availability, changing username, etc.)
 * 
 * Usage:
 * ```tsx
 * const { checkAvailability, changeUsername, getCooldown } = useUsernameManager();
 * 
 * // Check if username is available
 * const result = await checkAvailability('newname');
 * if (result.available) {
 *   // Username is available
 * }
 * 
 * // Change username (with cooldown enforcement)
 * const changeResult = await changeUsername(fursonaId, 'newname');
 * if (changeResult.success) {
 *   // Username changed
 * }
 * ```
 */
export function useUsernameManager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if a username is available
   * Returns availability status
   */
  const checkAvailability = useCallback(
    async (username: string): Promise<UsernameAvailability> => {
      setError(null);
      
      // Client-side validation (no loading state for instant feedback)
      const trimmedUsername = username.trim().toLowerCase();
      
      if (!trimmedUsername || trimmedUsername.length < 3 || trimmedUsername.length > 50) {
        const errorMsg = "Username must be 3-50 characters";
        setError(errorMsg);
        return {
          available: false,
          error: errorMsg,
        };
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        const errorMsg = "Only alphanumeric characters, underscore, and hyphen allowed";
        setError(errorMsg);
        return {
          available: false,
          error: errorMsg,
        };
      }

      setLoading(true);

      try {
        const response = await fetch(
          `/api/core/fursonas/${encodeURIComponent(trimmedUsername)}/available`
        );

        if (!response.ok) {
          const data = await response.json();
          const errorMsg = data.error || "Failed to check username availability";
          setError(errorMsg);
          return {
            available: false,
            error: errorMsg,
          };
        }

        const data = (await response.json()) as UsernameAvailability;
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        return { available: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    }, []
  );

  // TODO: Implement changeUsername and getCooldown
  // - changeUsername: Enforce 30-day cooldown, validate, update username
  // - getCooldown: Get cooldown status for a fursona

  return {
    checkAvailability,
    loading,
    error,
  };
}
