interface FormErrorProps {
  readonly message: string | null;
  readonly className?: string;
}

/**
 * Reusable error display component for forms.
 * Centralizes error styling across all form components.
 */
export function FormError({ message, className = "" }: Readonly<FormErrorProps>) {
  if (!message) return null;

  return (
    <p className={`text-sm text-red-500 ${className}`}>{message}</p>
  );
}
