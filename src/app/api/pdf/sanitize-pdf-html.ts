export function sanitizePdfHtml(input: string): string {
  return input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/giu, "")
    .replace(/(<(?:img|link)\b[^>]*(?:src|href)\s*=\s*)["']https?:\/\/[^"']*["']/giu, "$1\"\"");
}
