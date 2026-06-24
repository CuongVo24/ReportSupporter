import { describe, it, expect } from "vitest";
import { validateEvidence } from "./validate";
import type { EvidenceItem } from "@/types";

describe("validateEvidence offline validator", () => {
  const validItem: EvidenceItem = {
    id: "item-1",
    kind: "github",
    title: "Mã nguồn ứng dụng",
    url: "https://github.com/user/repo",
    note: "Link to repo",
    qrEnabled: true,
    createdAt: new Date().toISOString(),
  };

  it("should validate a completely correct item successfully", () => {
    const res = validateEvidence(validItem);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.item).toEqual(validItem);
    }
  });

  it("should fail validation if title is empty or missing", () => {
    const missingTitle = { ...validItem, title: "" };
    const res = validateEvidence(missingTitle);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.title).toContain("không được để trống");
    }
  });

  it("should fail validation if title is only whitespace", () => {
    const whitespaceTitle = { ...validItem, title: "   " };
    const res = validateEvidence(whitespaceTitle);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.title).toContain("không được để trống");
    }
  });

  it("should validate successfully if url is missing, undefined, or empty", () => {
    const noUrl = { ...validItem, url: undefined };
    const res = validateEvidence(noUrl);
    expect(res.ok).toBe(true);

    const emptyUrl = { ...validItem, url: "" };
    const res2 = validateEvidence(emptyUrl);
    expect(res2.ok).toBe(true);
  });

  it("should fail validation if url shape is malformed", () => {
    const badUrl = { ...validItem, url: "not-a-valid-url" };
    const res = validateEvidence(badUrl);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.url).toBeDefined();
    }
  });

  it("should fail validation if url protocol is not http or https", () => {
    const ftpUrl = { ...validItem, url: "ftp://ftp.example.com" };
    const res = validateEvidence(ftpUrl);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.url).toContain("http hoặc https");
    }
  });

  it("should fail validation if missing other required fields via schema", () => {
    const missingId = { ...validItem, id: undefined };
    const res = validateEvidence(missingId);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.id).toBeDefined();
    }
  });
});
