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
import { skippedHeadingLevelRule } from "./rules/heading-levels";
import { hardcodedHeadingNumberRule, emptySectionRule } from "./rules/structure";
import { missingCaptionsRule } from "./rules/captions";
import { brokenImageRule } from "./rules/images";
import { tableTooWideRule } from "./rules/table-width";
import { referencesRule } from "./rules/references";

/**
 * Ordered registry of all active checker rules.
 */
export const RULES_REGISTRY: CheckRule[] = [
  // Meta-rules & Sections
  tocDisabledRule,
  missingConclusionRule,
  missingReferencesRule,
  referencesRule,
  missingMemberTableRule,

  // Evidence gaps
  missingProjectLinksRule,
  missingRequiredEvidenceRule,
  brokenEvidenceUrlShapeRule,

  // Structural AST rules
  skippedHeadingLevelRule,
  hardcodedHeadingNumberRule,
  emptySectionRule,
  missingCaptionsRule,
  brokenImageRule,
  tableTooWideRule,

  // Text-based and code-block checks
  placeholderTextRule,
  codeLanguageRule,
];

