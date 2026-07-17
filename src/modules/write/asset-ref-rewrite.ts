/** Rewrites imported image references to stable local asset identifiers. */
export function rewriteMarkdownRefs(
  markdown: string,
  replacements: { original: string; assetId: string }[],
): string {
  let result = markdown;
  for (const replacement of replacements) {
    const escapedPath = replacement.original.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const markdownImage = new RegExp(`(!\\[.*?\\]\\()${escapedPath}(\\))`, "g");
    result = result.replace(markdownImage, `$1asset:${replacement.assetId}$2`);
    const htmlImage = new RegExp(`(<img\\s+[^>]*src=["'])${escapedPath}(["'])`, "gi");
    result = result.replace(htmlImage, `$1asset:${replacement.assetId}$2`);
  }
  return result;
}
