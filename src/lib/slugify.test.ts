import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("should convert simple text to lowercase and replace spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should strip Vietnamese diacritics correctly", () => {
    expect(slugify("Kiến trúc hệ thống")).toBe("kien-truc-he-thong");
    expect(slugify("Đại học Quốc gia")).toBe("dai-hoc-quoc-gia");
    expect(slugify("PHẦN MỀM")).toBe("phan-mem");
    expect(slugify("Đường sá đông đúc")).toBe("duong-sa-dong-duc");
  });

  it("should collapse multiple consecutive hyphens", () => {
    expect(slugify("Hello   World!!!")).toBe("hello-world");
    expect(slugify("a---b---c")).toBe("a-b-c");
  });

  it("should trim leading and trailing hyphens", () => {
    expect(slugify("---Hello World---")).toBe("hello-world");
  });

  it("should handle empty or undefined input gracefully", () => {
    expect(slugify("")).toBe("");
    expect(slugify(null as unknown as string)).toBe("");
  });

  it("should handle mixed non-alphanumeric symbols", () => {
    expect(slugify("Chương 1: Giới thiệu @2026")).toBe("chuong-1-gioi-thieu-2026");
  });
});
