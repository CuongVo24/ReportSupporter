"use client";

import React from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { X, CheckCircle2, Info, XCircle } from "lucide-react";
import "./Toast.css";

export type ToastVariant = "success" | "info" | "error";

export interface ToastProps extends React.ComponentPropsWithoutRef<typeof RadixToast.Root> {
  variant?: ToastVariant;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const ToastProvider = RadixToast.Provider;

export const ToastViewport = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<typeof RadixToast.Viewport>
>(({ className = "", ...props }, ref) => (
  <RadixToast.Viewport
    ref={ref}
    className={`ws-toast-viewport ${className}`}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

export const Toast = React.forwardRef<HTMLLIElement, ToastProps>(
  ({ variant = "info", title, description, action, duration, ...props }, ref) => {
    // success/info auto-dismiss after 4s (4000ms). error does not auto-dismiss.
    const defaultDuration = variant === "error" ? Infinity : 4000;
    const toastDuration = duration ?? defaultDuration;

    const Icon = {
      success: CheckCircle2,
      info: Info,
      error: XCircle,
    }[variant];

    const rootClassNames = [
      "ws-toast-root",
      `ws-toast-root-${variant}`,
    ].join(" ");

    return (
      <RadixToast.Root
        ref={ref}
        className={rootClassNames}
        duration={toastDuration}
        type={variant === "error" ? "foreground" : "background"}
        role={variant === "error" ? "alert" : "status"}
        {...props}
      >
        <div className="ws-toast-icon-container" aria-hidden="true">
          <Icon className={`ws-toast-icon ws-toast-icon-${variant}`} />
        </div>

        <div className="ws-toast-content">
          {title && (
            <RadixToast.Title className="ws-toast-title">
              {title}
            </RadixToast.Title>
          )}
          {description && (
            <RadixToast.Description className="ws-toast-description">
              {description}
            </RadixToast.Description>
          )}
        </div>

        {action && (
          <RadixToast.Action
            className="ws-toast-action-btn"
            altText={action.label}
            onClick={action.onClick}
          >
            {action.label}
          </RadixToast.Action>
        )}

        <RadixToast.Close className="ws-toast-close-btn" aria-label="Đóng">
          <X className="ws-toast-close-icon" aria-hidden="true" />
        </RadixToast.Close>
      </RadixToast.Root>
    );
  }
);
Toast.displayName = "Toast";
