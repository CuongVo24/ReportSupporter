import { describe, it, expect } from "vitest";
import type { CaptionEntry } from "@/types";
import { generateListOfFigures, generateListOfTables } from "./generate-lof-lot";

describe("List of Figures & List of Tables Generator", () => {
  const mockRegistry: CaptionEntry[] = [
    {
      id: "fig-1",
      kind: "figure",
      number: 1,
      label: "Hình 1.1",
      text: "Sơ đồ kiến trúc",
      sectionId: "sec-1",
    },
    {
      id: "table-1",
      kind: "table",
      number: 1,
      label: "Bảng 1.1",
      text: "Danh sách thành viên",
      sectionId: "sec-1",
    },
    {
      id: "fig-2",
      kind: "figure",
      number: 2,
      label: "Hình 1.2",
      text: "Biểu đồ cột",
      sectionId: "sec-2",
    },
    {
      id: "table-2",
      kind: "table",
      number: 2,
      label: "Bảng 1.2",
      text: "Kết quả khảo sát",
      sectionId: "sec-2",
    },
  ];

  it("should extract figures from the registry in correct document order", () => {
    const lof = generateListOfFigures(mockRegistry);
    expect(lof).toHaveLength(2);
    expect(lof[0]).toEqual(mockRegistry[0]);
    expect(lof[1]).toEqual(mockRegistry[2]);
  });

  it("should extract tables from the registry in correct document order", () => {
    const lot = generateListOfTables(mockRegistry);
    expect(lot).toHaveLength(2);
    expect(lot[0]).toEqual(mockRegistry[1]);
    expect(lot[1]).toEqual(mockRegistry[3]);
  });

  it("should not renumber captions, retaining the registry numbers", () => {
    const lof = generateListOfFigures(mockRegistry);
    const lot = generateListOfTables(mockRegistry);

    expect(lof[0].number).toBe(1);
    expect(lof[1].number).toBe(2);

    expect(lot[0].number).toBe(1);
    expect(lot[1].number).toBe(2);
  });
});
