import type { EvidenceKind } from "@/types";

export const kindMeta: Record<EvidenceKind, { label: string; icon: string }> = {
  video: { label: "Video demo", icon: "🎥" },
  github: { label: "Mã nguồn (GitHub)", icon: "💻" },
  deploy: { label: "Bản triển khai (Deploy)", icon: "🚀" },
  drive: { label: "Tài liệu (Google Drive)", icon: "📁" },
  figma: { label: "Thiết kế (Figma)", icon: "🎨" },
  account: { label: "Tài khoản kiểm thử", icon: "🔑" },
  "api-docs": { label: "Tài liệu API", icon: "📄" },
  slide: { label: "Slide trình bày", icon: "📊" },
  other: { label: "Minh chứng khác", icon: "📎" },
};
