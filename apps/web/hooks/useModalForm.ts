/**
 * useModalForm Hook
 * Consolidates loading, error, and submission logic for modal forms
 * Eliminates duplication across EditProfileModal, ReportProfileModal, AdminPanelModal
 */

import { useState } from "react";
import { getErrorMessage } from "@/lib/helpers/error-utils";

interface UseModalFormOptions<T> {
  onSubmit: (values: T) => Promise<void>;
  onSuccess?: () => void;
  resetValuesOnSuccess?: boolean;
}

interface UseModalFormReturn<T> {
  loading: boolean;
  error: string | null;
  handleSubmit: (values: T) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * Custom hook for modal form management
 * Handles: loading state, error state, submission logic
 *
 * @example
 * const { loading, error, handleSubmit, clearError } = useModalForm({
 *   onSubmit: async (values) => {
 *     await api.post("/api/endpoint", values);
 *   },
 *   onSuccess: () => onClose(),
 * });
 */
export function useModalForm<T = unknown>(
  options: UseModalFormOptions<T>,
): UseModalFormReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: T) => {
    setLoading(true);
    setError(null);

    try {
      await options.onSubmit(values);
      options.onSuccess?.();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    loading,
    error,
    handleSubmit,
    setError,
    clearError,
  };
}
