"use client";

import React, { useEffect, ReactNode } from "react";
import { X } from "lucide-react";

type MobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  side: "left" | "right";
  title: string;
  children: ReactNode;
};

export function MobileDrawer({ isOpen, onClose, side, title, children }: MobileDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="ws-mobile-drawer-overlay" onClick={onClose} />
      <div
        className={`ws-mobile-drawer-content ws-mobile-drawer-${side}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="ws-drawer-close-header">
          <button
            type="button"
            className="ws-drawer-close-btn"
            onClick={onClose}
            aria-label="Đóng panel"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {children}
        </div>
      </div>
    </>
  );
}
