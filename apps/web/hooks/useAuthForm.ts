"use client";
import React, { useState, useCallback } from "react";

interface UseAuthFormOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for managing auth form state and submission.
 * Centralizes form logic shared across LoginForm, SignUpForm, etc.
 */
export function useAuthForm<T extends Record<string, unknown>>(initialValues: T, onSubmit: (values: T) => Promise<void>, options?: UseAuthFormOptions) {
  const [values, setValues] = useState<T>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = useCallback((field: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setError(null);
  },[]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      try {
        await onSubmit(values);
        options?.onSuccess?.();

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        options?.onError?.(err instanceof Error ? err : new Error(errorMessage));

      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, onSubmit]
  );

  return {
    values,
    setValues,
    error,
    setError,
    isLoading,
    handleChange,
    handleSubmit,
  };
}
