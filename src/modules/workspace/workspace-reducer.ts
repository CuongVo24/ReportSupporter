import type { Dispatch, SetStateAction } from "react";
import type { ReportProjectBundle } from "@/types";

export type WorkspaceState = {
  bundle: ReportProjectBundle | null;
  activeSectionId: string | null;
  invalidDraft: { raw: unknown; issues: string[] } | null;
  loadError: string;
  command: { name: string; status: "idle" | "running" | "error"; error?: string };
};

export type WorkspaceEvent =
  | { type: "project-loaded"; bundle: ReportProjectBundle }
  | { type: "bundle-transitioned"; transition: SetStateAction<ReportProjectBundle | null> }
  | { type: "active-section-changed"; sectionId: string | null }
  | { type: "invalid-draft-changed"; draft: WorkspaceState["invalidDraft"] }
  | { type: "load-failed"; message: string }
  | { type: "command-started"; name: string }
  | { type: "command-failed"; name: string; error: string }
  | { type: "command-completed"; name: string };

export const initialWorkspaceState: WorkspaceState = {
  bundle: null,
  activeSectionId: null,
  invalidDraft: null,
  loadError: "",
  command: { name: "", status: "idle" },
};

export function workspaceReducer(state: WorkspaceState, event: WorkspaceEvent): WorkspaceState {
  switch (event.type) {
    case "project-loaded":
      return {
        ...state,
        bundle: event.bundle,
        activeSectionId: event.bundle.project.sections[0]?.id ?? null,
        invalidDraft: null,
        loadError: "",
      };
    case "bundle-transitioned": {
      const bundle = typeof event.transition === "function"
        ? event.transition(state.bundle)
        : event.transition;
      return { ...state, bundle };
    }
    case "active-section-changed":
      return { ...state, activeSectionId: event.sectionId };
    case "invalid-draft-changed":
      return { ...state, invalidDraft: event.draft };
    case "load-failed":
      return { ...state, loadError: event.message };
    case "command-started":
      return { ...state, command: { name: event.name, status: "running" } };
    case "command-failed":
      return { ...state, command: { name: event.name, status: "error", error: event.error } };
    case "command-completed":
      return { ...state, command: { name: event.name, status: "idle" } };
  }
}

export function createWorkspaceStateAdapters(dispatch: Dispatch<WorkspaceEvent>) {
  return {
    setBundle: ((transition) => dispatch({ type: "bundle-transitioned", transition })) as Dispatch<SetStateAction<ReportProjectBundle | null>>,
    setActiveSectionId: (sectionId: string | null) => dispatch({ type: "active-section-changed", sectionId }),
    setInvalidDraft: (draft: WorkspaceState["invalidDraft"]) => dispatch({ type: "invalid-draft-changed", draft }),
    setLoadError: (message: string) => dispatch({ type: "load-failed", message }),
  };
}
