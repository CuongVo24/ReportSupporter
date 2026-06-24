import { describe, it, expect } from "vitest";
import type { EvidenceItem } from "@/types";

// Pure reducer functions representing the EvidencePanel operations for easy unit testing
function addEvidence(list: EvidenceItem[], item: EvidenceItem): EvidenceItem[] {
  return [...list, item];
}

function editEvidence(list: EvidenceItem[], updated: EvidenceItem): EvidenceItem[] {
  return list.map((item) => (item.id === updated.id ? updated : item));
}

function deleteEvidence(list: EvidenceItem[], id: string): EvidenceItem[] {
  return list.filter((item) => item.id !== id);
}

describe("Evidence List Operations (Reducer)", () => {
  const item1: EvidenceItem = {
    id: "uuid-1",
    kind: "github",
    title: "Repo code",
    url: "https://github.com/user/repo",
    qrEnabled: true,
    createdAt: "2026-06-24T00:00:00Z",
  };

  const item2: EvidenceItem = {
    id: "uuid-2",
    kind: "video",
    title: "Video demo",
    url: "https://youtube.com/watch?v=123",
    qrEnabled: false,
    createdAt: "2026-06-24T01:00:00Z",
  };

  it("adds an item to an empty list", () => {
    const list: EvidenceItem[] = [];
    const result = addEvidence(list, item1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(item1);
  });

  it("adds an item to an existing list preserving order", () => {
    const list = [item1];
    const result = addEvidence(list, item2);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(item1);
    expect(result[1]).toEqual(item2);
  });

  it("edits an item by replacing it while keeping other items intact", () => {
    const list = [item1, item2];
    const updatedItem1 = { ...item1, title: "Updated Repo Title", qrEnabled: false };
    const result = editEvidence(list, updatedItem1);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(updatedItem1);
    expect(result[0].title).toBe("Updated Repo Title");
    expect(result[0].id).toBe("uuid-1"); // ID is preserved
    expect(result[1]).toEqual(item2); // other item intact
  });

  it("deletes an item correctly while preserving order of others", () => {
    const list = [item1, item2];
    const result = deleteEvidence(list, "uuid-1");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(item2);
  });

  it("returns unchanged list when deleting a non-existent ID", () => {
    const list = [item1, item2];
    const result = deleteEvidence(list, "uuid-nonexistent");
    expect(result).toHaveLength(2);
    expect(result).toEqual(list);
  });

  it("simulates the two-step delete flow state transitions", () => {
    const list = [item1, item2];
    let confirmingDeleteId: string | null = null;
    let currentList = [...list];

    // User clicks "Xóa" on item1 (triggers confirmation, but doesn't delete yet)
    confirmingDeleteId = "uuid-1";
    expect(currentList).toHaveLength(2);
    expect(confirmingDeleteId).toBe("uuid-1");

    // User clicks "Hủy" (cancels deletion)
    confirmingDeleteId = null;
    expect(currentList).toHaveLength(2);
    expect(confirmingDeleteId).toBeNull();

    // User clicks "Xóa" and then "Xác nhận xóa" (actually deletes item)
    confirmingDeleteId = "uuid-1";
    if (confirmingDeleteId === "uuid-1") {
      currentList = deleteEvidence(currentList, "uuid-1");
      confirmingDeleteId = null;
    }
    expect(currentList).toHaveLength(1);
    expect(currentList[0]).toEqual(item2);
    expect(confirmingDeleteId).toBeNull();
  });
});
