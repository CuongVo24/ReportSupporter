"use client";

import React, { useEffect, useState } from "react";
import { toQrDataUrl } from "./evidence-qr";


export function EvidenceQrPreview({ url }: { url: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    if (!url) {
      setQrDataUrl("");
      return;
    }
    void (async () => {
      const dataUrl = await toQrDataUrl(url);
      if (active) {
        setQrDataUrl(dataUrl);
      }
    })();
    return () => {
      active = false;
    };
  }, [url]);

  if (!url || !qrDataUrl) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={qrDataUrl}
      alt={`QR: ${url}`}
      className="ws-evidence-qr-img"
      style={{
        display: "inline-block",
        width: "100px",
        height: "100px",
        verticalAlign: "middle",
        marginLeft: "8px",
      }}
    />
  );
}
