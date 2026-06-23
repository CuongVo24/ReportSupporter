import type { CheckRule } from "@/types";
import { placeholderTextRule } from "./rules/text-markers";
import { codeLanguageRule } from "./rules/code-language";
import {
  tocDisabledRule,
  missingConclusionRule,
  missingReferencesRule,
  missingMemberTableRule,
} from "./rules/missing-sections";
import {
  missingProjectLinksRule,
  missingRequiredEvidenceRule,
  brokenEvidenceUrlShapeRule,
} from "./rules/evidence-gaps";

/**
 * Ordered registry of all active checker rules.
 */
export const RULES_REGISTRY: CheckRule[] = [
  // Meta-rules & Sections
  tocDisabledRule,
  missingConclusionRule,
  missingReferencesRule,
  missingMemberTableRule,

  // Evidence gaps
  missingProjectLinksRule,
  missingRequiredEvidenceRule,
  brokenEvidenceUrlShapeRule,

  // Text-based and code-block checks
  placeholderTextRule,
  codeLanguageRule,
];
