import { useCallback, useState } from "react";

interface UsernameAvailability {
  available: boolean;
  username?: string;
  // suggestions?: string[];
  error?: string;
}

interface UsernameChangeResult {
  success: boolean;
  old_username?: string;
  new_username?: string;
  changed_at?: string;
  error?: string;
  cooldown_until?: string;
  cooldown_days_remaining?: number;
}

interface UsernameCooldown {
  can_change: boolean;
  current_username: string;
  last_changed_at: string | null;
  cooldown_active: boolean;
  cooldown_until?: string;
  cooldown_days_remaining?: number;
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
 * } else {
 *   // Show suggestions
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
   * Returns availability status and suggestions if taken
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

      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        const errorMsg = "Only alphanumeric characters, underscore, and hyphen allowed";
        setError(errorMsg);
        return {
          available: false,
          error: errorMsg,
        };
      }

      // Server-side check (with loading state)
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search/username/${encodeURIComponent(trimmedUsername)}/available`
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
    },
    []
  );

  /**
   * Change a fursona's username
   * Enforces 30-day cooldown and checks availability
   */
  const changeUsername = useCallback(
    async (
      fursonaId: string,
      newUsername: string
    ): Promise<UsernameChangeResult> => {
      setLoading(true);
      setError(null);

      try {
        // Validate format first
        if (!newUsername || newUsername.length < 3 || newUsername.length > 50) {
          const err = "Username must be 3-50 characters";
          setError(err);
          return { success: false, error: err };
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
          const err = "Only alphanumeric characters, underscore, and hyphen allowed";
          setError(err);
          return { success: false, error: err };
        }

        const response = await fetch(
          `/api/profile/me/${encodeURIComponent(fursonaId)}/change-username`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              new_username: newUsername.toLowerCase(),
            }),
          }
        );

        const data = (await response.json()) as UsernameChangeResult;

        if (!response.ok) {
          setError(data.error || "Failed to change username");
          return data;
        }

        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get cooldown information for a fursona's username change
   */
  const getCooldown = useCallback(
    async (fursonaId: string): Promise<UsernameCooldown | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/profile/me/${encodeURIComponent(fursonaId)}/change-username`
        );

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Failed to get cooldown info");
          return null;
        }

        const data = (await response.json()) as UsernameCooldown;
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get username history for a fursona
   */
  const getHistory = useCallback(
    async (fursonaId: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/profile/me/${encodeURIComponent(fursonaId)}/username-history`
        );

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Failed to get username history");
          return null;
        }

        return await response.json();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    checkAvailability,
    changeUsername,
    getCooldown,
    getHistory,
    loading,
    error,
  };
}
