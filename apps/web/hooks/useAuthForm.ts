"use client";

import React, { useState, useCallback } from "react";
import { getErrorMessage } from "@/lib/helpers/error-utils";

interface UseFormOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  resetOnSuccess?: boolean;
}

interface UseFormReturn<T> {
  values: T;
  setValues: (values: T | ((prev: T) => T)) => void;
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  isLoading: boolean;
  handleChange: (field: keyof T, value: string) => void;
  handleSubmit: (e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
}

/**
 * Universal form hook for managing form state and submission.
 * @example
 * const { values, error, handleSubmit } = useForm(
 *   { email: '', password: '' },
 *   async (values) => await api.post('/login', values),
 *   { onSuccess: () => router.push('/') }
 * );
 *
 * const { isLoading, error, handleSubmit } = useForm(
 *   {},
 *   async (values) => { ... },
 *   { onSuccess: () => {} }
 * );
 */
export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>,
  options?: UseFormOptions,
): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = useCallback((field: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const handleSubmit = useCallback(
    async (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      try {
        await onSubmit(values);
        if (options?.resetOnSuccess) {
          setValues(initialValues);
        }
        options?.onSuccess?.();
      } catch (err: unknown) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        options?.onError?.(
          err instanceof Error ? err : new Error(errorMessage),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [values, onSubmit, options, initialValues],
  );

  return {
    values,
    setValues,
    error,
    setError,
    clearError,
    isLoading,
    handleChange,
    handleSubmit,
  };
}

// Backward compatibility exports
export { useForm as useAuthForm };
