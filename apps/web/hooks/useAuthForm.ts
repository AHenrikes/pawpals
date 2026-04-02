"use client";
import React, { useState, useCallback } from "react";

interface UseAuthFormOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  maxErrorCount?: number;
  thresholdErrorMessage?: string;
}

/**
 * Custom hook for managing auth form state and submission.
 * Centralizes form logic shared across LoginForm, SignUpForm, etc.
 */
export function useAuthForm<T extends Record<string, unknown>>(initialValues: T, onSubmit: (values: T) => Promise<void>, options?: UseAuthFormOptions) {
  const [values, setValues] = useState<T>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const onSuccess = options?.onSuccess;
  const onError = options?.onError;
  const maxErrorCount = options?.maxErrorCount ?? 5;
  const thresholdErrorMessage = options?.thresholdErrorMessage ?? `Are you even trying?`;

  const handleChange = useCallback((field: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setError(null);
  },[]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      try {
        await onSubmit(values);
        setErrorCount(0);
        onSuccess?.();

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setErrorCount((prev) => {
          const nextCount = prev + 1;
          setError(nextCount >= maxErrorCount ? thresholdErrorMessage : errorMessage);
          return nextCount;
        });
        onError?.(err instanceof Error ? err : new Error(errorMessage));

      } finally { setIsLoading(false)}
    },

    [values, onSubmit, onSuccess, onError, maxErrorCount, thresholdErrorMessage]
  );

  return {
    values,
    setValues,
    error,
    errorCount,
    setError,
    isLoading,
    handleChange,
    handleSubmit,
  };
}
