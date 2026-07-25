import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { ToastProvider, ToastViewport } from "@/components/ui";
import { PwaManager } from "@/components/PwaManager";

const fontUi = Inter({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-ui",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReportSupporter",
  description: "Workspace-first report authoring for students and project teams",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Same nonce src/middleware.ts put on the CSP header for this request —
  // required for this inline script to run under a strict script-src that
  // has no 'unsafe-inline'.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="vi" suppressHydrationWarning className={`${fontUi.variable} ${fontMono.variable}`}>
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('rs-theme') || 'system';
                  var resolved = theme;
                  if (theme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', resolved);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ToastProvider>
          {children}
          <PwaManager />
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}
