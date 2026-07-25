// W25-I: post-rehype-sanitize narrowing for `style`/`className`.
//
// rehype-sanitize's schema can only allowlist an ATTRIBUTE NAME (e.g.
// "style", "className") — it has no way to constrain the VALUE to a safe
// subset of CSS properties or an app-owned class-name prefix. Without this
// extra pass, allowing `style`/`className` at all (needed for KaTeX,
// highlight.js, and app-generated markup) means any CSS declaration or
// arbitrary class name survives sanitize. This module runs as one more
// pass over the hast tree, AFTER rehype-sanitize, and narrows both down to
// an explicit allowlist. No new dependency: walks `node.children` directly
// instead of pulling in unist-util-visit.
import type { Root as HastRoot, Element as HastElement, Node as HastNode } from "hast";

// KaTeX/highlight.js/app-generated classes only. Anything else is dropped.
const ALLOWED_CLASS_PREFIXES = [
  "katex",
  "hljs",
  "ws-",
  "language-",
  "mermaid",
];

// Safe, presentational-only CSS properties. Anything layout/behavior-adjacent
// (position, z-index, pointer-events, filter, transform with matrix/skew,
// animation, etc.) is intentionally excluded to limit clickjacking/overlay tricks.
const ALLOWED_STYLE_PROPERTIES = new Set([
  "color",
  "background-color",
  "font-weight",
  "font-style",
  "font-size",
  "text-align",
  "text-decoration",
  "width",
  "height",
  "max-width",
  "max-height",
  "margin",
  "margin-top",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "padding",
  "padding-top",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "border",
  "border-color",
  "border-radius",
  "vertical-align",
  "white-space",
  "display",
  "opacity",
]);

// Reject any value containing these regardless of property — covers CSS
// exfiltration/URL-fetch vectors (`url()`), legacy IE `expression()`, and
// script-scheme confusion even though modern browsers no longer execute
// `javascript:` inside `style`.
const UNSAFE_VALUE_PATTERN = /url\s*\(|expression\s*\(|javascript:|@import/iu;

function sanitizeClassNameValue(raw: unknown): string[] | undefined {
  const tokens = Array.isArray(raw) ? raw.map(String) : typeof raw === "string" ? raw.split(/\s+/u) : [];
  const kept = tokens.filter((token) => ALLOWED_CLASS_PREFIXES.some((prefix) => token.startsWith(prefix)));
  return kept.length > 0 ? kept : undefined;
}

function sanitizeStyleValue(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const declarations = raw.split(";");
  const kept: string[] = [];
  for (const decl of declarations) {
    const colonIndex = decl.indexOf(":");
    if (colonIndex === -1) continue;
    const property = decl.slice(0, colonIndex).trim().toLowerCase();
    const value = decl.slice(colonIndex + 1).trim();
    if (!property || !value) continue;
    if (!ALLOWED_STYLE_PROPERTIES.has(property)) continue;
    if (UNSAFE_VALUE_PATTERN.test(value)) continue;
    kept.push(`${property}: ${value}`);
  }
  return kept.length > 0 ? kept.join("; ") : undefined;
}

function isElement(node: HastNode): node is HastElement {
  return node.type === "element";
}

function walk(node: HastNode): void {
  if (isElement(node) && node.properties) {
    if ("className" in node.properties) {
      const next = sanitizeClassNameValue(node.properties.className);
      if (next) node.properties.className = next;
      else delete node.properties.className;
    }
    if ("style" in node.properties) {
      const next = sanitizeStyleValue(node.properties.style);
      if (next) node.properties.style = next;
      else delete node.properties.style;
    }
  }
  const children = (node as { children?: HastNode[] }).children;
  if (Array.isArray(children)) {
    for (const child of children) walk(child);
  }
}

/** Unified/rehype plugin: narrows `style`/`className` on every element in place. */
export function rehypeNarrowStyleAndClassName() {
  return (tree: HastRoot) => {
    walk(tree);
  };
}
