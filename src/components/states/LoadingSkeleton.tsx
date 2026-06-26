"use client";

import React from "react";
import "./LoadingSkeleton.css";

type LoadingSkeletonProps = {
  variant?: "preview" | "panel" | "editor";
};

export function LoadingSkeleton({ variant = "preview" }: LoadingSkeletonProps) {
  if (variant === "preview") {
    return (
      <div className="ws-skeleton-preview-wrapper" role="status" aria-label="Đang tải bản in thử...">
        <div className="ws-skeleton-page">
          <div className="ws-skeleton-line ws-skeleton-header" />
          
          <div className="ws-skeleton-group">
            <div className="ws-skeleton-line ws-skeleton-h1" />
            <div className="ws-skeleton-line ws-skeleton-body-1" />
            <div className="ws-skeleton-line ws-skeleton-body-2" />
            <div className="ws-skeleton-line ws-skeleton-body-3" />
          </div>

          <div className="ws-skeleton-group" style={{ marginTop: "var(--rs-space-6)" }}>
            <div className="ws-skeleton-line ws-skeleton-h2" />
            <div className="ws-skeleton-line ws-skeleton-body-1" />
            <div className="ws-skeleton-line ws-skeleton-body-4" />
            <div className="ws-skeleton-box" />
            <div className="ws-skeleton-line ws-skeleton-caption" />
          </div>
        </div>
      </div>
    );
  }

  // Generic panel skeleton
  return (
    <div className="ws-skeleton-panel-wrapper" role="status" aria-label="Đang tải...">
      <div className="ws-skeleton-line ws-skeleton-panel-header" />
      <div className="ws-skeleton-panel-body">
        <div className="ws-skeleton-line ws-skeleton-panel-row" />
        <div className="ws-skeleton-line ws-skeleton-panel-row" />
        <div className="ws-skeleton-line ws-skeleton-panel-row" />
        <div className="ws-skeleton-line ws-skeleton-panel-row" />
      </div>
    </div>
  );
}
