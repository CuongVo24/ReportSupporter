/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { NetworkOnly, Serwist, type PrecacheEntry, type RuntimeCaching } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[];
  }
}
declare const self: ServiceWorkerGlobalScope;

const apiNetworkOnly: RuntimeCaching[] = (["GET", "POST"] as const).map((method) => ({
  matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/api/"),
  method,
  handler: new NetworkOnly(),
}));

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...apiNetworkOnly, ...defaultCache],
  fallbacks: {
    entries: [{
      url: "/offline",
      matcher: ({ request }) => request.destination === "document",
    }],
  },
});

serwist.addEventListeners();
