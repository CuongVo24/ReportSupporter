import React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import "./Dialog.css";

export interface DialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: "modal" | "drawer" | "confirm";
  preventDismissOnOutsideClick?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  variant = "modal",
  preventDismissOnOutsideClick,
  children,
  footer,
}) => {
  // Block backdrop click for confirm variant (Esc always allowed per a11y standard)
  const shouldBlockBackdrop = preventDismissOnOutsideClick ?? (variant === "confirm");

  const handlePointerDownOutside = (e: CustomEvent) => {
    if (shouldBlockBackdrop) {
      e.preventDefault();
    }
  };

  const overlayClassNames = [
    "ws-dialog-overlay",
    `ws-dialog-overlay-${variant}`,
  ].join(" ");

  const contentClassNames = [
    "ws-dialog-content",
    `ws-dialog-content-${variant}`,
  ].join(" ");

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlayClassNames} />
        
        <RadixDialog.Content
          className={contentClassNames}
          onPointerDownOutside={handlePointerDownOutside}
          {...(!description && { "aria-describedby": undefined })}
        >
          <div className="ws-dialog-header">
            <RadixDialog.Title className="ws-dialog-title">
              {title}
            </RadixDialog.Title>

            <RadixDialog.Close className="ws-dialog-close-btn" aria-label="Đóng">
              <X className="ws-dialog-close-icon" aria-hidden="true" />
            </RadixDialog.Close>
          </div>

          {description && (
            <RadixDialog.Description className="ws-dialog-description">
              {description}
            </RadixDialog.Description>
          )}

          <div className="ws-dialog-body">
            {children}
          </div>

          {footer && (
            <div className="ws-dialog-footer">
              {footer}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};
