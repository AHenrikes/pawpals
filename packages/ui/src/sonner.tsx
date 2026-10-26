"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  toast as sonnerToast,
  Toaster as Sonner,
  type ToasterProps,
} from "sonner";

type ToastMessage = Parameters<typeof sonnerToast>[0];
type ToastOptions = Parameters<typeof sonnerToast>[1];

function withNotificationId(
  kind: string,
  message: ToastMessage,
  options?: ToastOptions,
): ToastOptions {
  return {
    ...options,
    // Sonner updates an active toast with the same ID instead of stacking it.
    // Keep caller-provided IDs and leave rich content to Sonner's normal behavior.
    id:
      options?.id ??
      (typeof message === "string" ? `${kind}:${message}` : undefined),
  };
}

const toast: typeof sonnerToast = Object.assign(
  (message: ToastMessage, options?: ToastOptions) =>
    sonnerToast(message, withNotificationId("default", message, options)),
  sonnerToast,
  {
    success: (message: ToastMessage, options?: ToastOptions) =>
      sonnerToast.success(
        message,
        withNotificationId("success", message, options),
      ),
    info: (message: ToastMessage, options?: ToastOptions) =>
      sonnerToast.info(message, withNotificationId("info", message, options)),
    warning: (message: ToastMessage, options?: ToastOptions) =>
      sonnerToast.warning(
        message,
        withNotificationId("warning", message, options),
      ),
    error: (message: ToastMessage, options?: ToastOptions) =>
      sonnerToast.error(message, withNotificationId("error", message, options)),
    message: (message: ToastMessage, options?: ToastOptions) =>
      sonnerToast.message(
        message,
        withNotificationId("message", message, options),
      ),
  },
);

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group text-center"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "hsl(var(--popover))",
          "--normal-text": "hsl(var(--text))",
          "--normal-border": "hsl(var(--ring))",
          "--success-bg": "hsl(var(--primary))",
          "--success-border": "hsl(var(--primary-dim))",
          "--success-text": "hsl(var(--primary-foreground))",
          "--info-bg": "hsl(var(--secondary))",
          "--info-border": "hsl(var(--secondary))",
          "--info-text": "hsl(var(--secondary-foreground))",
          "--warning-bg": "hsl(var(--accent))",
          "--warning-border": "hsl(var(--accent))",
          "--warning-text": "hsl(var(--accent-foreground))",
          "--error-bg": "hsl(var(--destructive))",
          "--error-border": "hsl(var(--destructive))",
          "--error-text": "hsl(var(--destructive-foreground))",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
