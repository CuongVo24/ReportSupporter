import React from "react";
import { notFound } from "next/navigation";

interface DevLayoutProps {
  children: React.ReactNode;
}

export default function DevLayout({ children }: DevLayoutProps) {
  // If running in production mode, completely hide the visual gallery and return a 404 response
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <>{children}</>;
}
