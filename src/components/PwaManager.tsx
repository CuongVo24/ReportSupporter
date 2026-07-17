"use client";

import { useEffect, useRef, useState } from "react";
import { isFeatureEnabled } from "@/lib/feature-flags";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaManager() {
  const pwaEnabled = isFeatureEnabled("pwa");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const reloadForUpdate = useRef(false);

  useEffect(() => {
    if (!pwaEnabled) return;
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) setWaitingWorker(registration.waiting);
        registration.addEventListener("updatefound", () => {
          registration.installing?.addEventListener("statechange", () => {
            if (registration.waiting) setWaitingWorker(registration.waiting);
          });
        });
      });
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloadForUpdate.current) window.location.reload();
      });
    }
    return () => window.removeEventListener("beforeinstallprompt", beforeInstall);
  }, [pwaEnabled]);

  if (!pwaEnabled) return null;

  const activateUpdate = async () => {
    if (!waitingWorker) return;
    const flushed = new Promise<void>((resolve) => {
      const timeout = window.setTimeout(resolve, 1_500);
      window.addEventListener("rs:autosave-flushed", () => {
        window.clearTimeout(timeout);
        resolve();
      }, { once: true });
    });
    window.dispatchEvent(new Event("rs:flush-autosave"));
    await flushed;
    reloadForUpdate.current = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  if (!installPrompt && !waitingWorker) return null;
  return <aside aria-label="Cài đặt và cập nhật ứng dụng" style={{ position: "fixed", right: 16, bottom: 16, zIndex: 1000, display: "flex", gap: 8, padding: 10, border: "1px solid #94a3b8", borderRadius: 10, background: "var(--rs-color-surface, white)" }}>
    {installPrompt && <button onClick={async () => {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    }}>Cài ứng dụng</button>}
    {waitingWorker && <button onClick={() => void activateUpdate()}>Lưu xong và cập nhật</button>}
  </aside>;
}
