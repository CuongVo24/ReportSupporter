"use client";

import { useState, useCallback } from "react";
import type { ReportAsset, ReportProjectBundle } from "@/types";

/**
 * Validates and converts an image file into a base64-encoded ReportAsset.
 * Returns the created asset and markdown reference tag.
 */
export function createImageAsset(
  file: File,
  maxBytes: number
): Promise<{ ok: true; asset: ReportAsset; ref: string } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    if (file.size > maxBytes) {
      const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
      resolve({
        ok: false,
        error: `Ảnh vượt quá giới hạn dung lượng cho phép (${maxMb}MB).`,
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      resolve({
        ok: false,
        error: "Tệp tải lên không phải là ảnh hợp lệ.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const assetId = crypto.randomUUID();
      const asset: ReportAsset = {
        id: assetId,
        kind: "image",
        fileName: file.name,
        mimeType: file.type,
        data: dataUrl,
        insertedAt: new Date().toISOString(),
      };
      const ref = `![${file.name}](asset:${assetId})`;
      resolve({
        ok: true,
        asset,
        ref,
      });
    };
    reader.onerror = () => {
      resolve({
        ok: false,
        error: "Có lỗi xảy ra khi đọc tệp ảnh.",
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Hook to manage image attachments insertion state within Workspace.
 */
export function useImageInsert(
  setBundle: React.Dispatch<React.SetStateAction<ReportProjectBundle | null>>
) {
  const [error, setError] = useState<string | null>(null);

  const handleImageInserted = useCallback((asset: ReportAsset) => {
    setBundle((prev) => {
      if (!prev) return prev;
      // Prevent duplicates
      if (prev.assets.some((a) => a.id === asset.id)) return prev;
      return {
        ...prev,
        assets: [...prev.assets, asset],
        project: {
          ...prev.project,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, [setBundle]);

  return {
    handleImageInserted,
    imageError: error,
    setImageError: setError,
  };
}
