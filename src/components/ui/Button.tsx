"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import "./Button.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  fullWidth?: boolean;
  iconOnly?: boolean;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      fullWidth = false,
      iconOnly = false,
      loading = false,
      disabled = false,
      leadingIcon,
      trailingIcon,
      children,
      className = "",
      onClick,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isBtnDisabled = disabled || loading;

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isBtnDisabled) {
        e.preventDefault();
        return;
      }
      if (onClick) {
        onClick(e);
      }
    };

    // Build className
    const classNames = [
      "ws-btn",
      `ws-btn-${variant}`,
      `ws-btn-${size}`,
      fullWidth ? "ws-btn-full-width" : "",
      iconOnly ? "ws-btn-icon-only" : "",
      loading ? "ws-btn-loading" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        disabled={isBtnDisabled}
        className={classNames}
        onClick={handleButtonClick}
        aria-busy={loading ? "true" : undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="ws-btn-spinner" aria-hidden="true" />
        ) : leadingIcon ? (
          <span className="ws-btn-icon ws-btn-leading-icon" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}

        {!iconOnly && children && <span className="ws-btn-label">{children}</span>}

        {!loading && trailingIcon && !iconOnly && (
          <span className="ws-btn-icon ws-btn-trailing-icon" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
