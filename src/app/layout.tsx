import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider, ToastViewport } from "@/components/ui";

export const metadata: Metadata = {
  title: "ReportSupporter",
  description: "Workspace-first report authoring for students and project teams",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" data-theme="light">
      <body>
        <ToastProvider>
          {children}
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}
