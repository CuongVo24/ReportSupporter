import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${fontUi.variable} ${fontMono.variable}`}>
      <head>
        <script
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
