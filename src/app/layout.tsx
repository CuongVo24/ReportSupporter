import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReportSupporter",
  description: "Workspace-first report authoring for students and project teams",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
