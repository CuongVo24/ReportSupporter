import type { EvidenceKind } from "@/types";

export const kindMeta: Record<EvidenceKind, { label: string; icon: string }> = {
  video: { label: "Video demo", icon: "Video" },
  github: { label: "Mã nguồn (GitHub)", icon: "Github" },
  deploy: { label: "Bản triển khai (Deploy)", icon: "Rocket" },
  drive: { label: "Tài liệu (Google Drive)", icon: "FolderOpen" },
  figma: { label: "Thiết kế (Figma)", icon: "Palette" },
  account: { label: "Tài khoản kiểm thử", icon: "KeyRound" },
  "api-docs": { label: "Tài liệu API", icon: "FileText" },
  slide: { label: "Slide trình bày", icon: "Presentation" },
  other: { label: "Minh chứng khác", icon: "Paperclip" },
};
