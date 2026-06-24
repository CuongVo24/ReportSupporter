import { describe, it, expect } from "vitest";
import { parseTextList } from "./MetadataForm";

describe("parseTextList helper", () => {
  it("splits by comma, trims whitespace, and filters empty strings", () => {
    expect(parseTextList("Đỗ Nguyễn, Lê An, ")).toEqual(["Đỗ Nguyễn", "Lê An"]);
    expect(parseTextList("   A,  B  ,, C ")).toEqual(["A", "B", "C"]);
    expect(parseTextList("")).toEqual([]);
  });

  it("preserves spaces inside name items", () => {
    expect(parseTextList("Đỗ Nguyễn Tiến Phú")).toEqual(["Đỗ Nguyễn Tiến Phú"]);
  });

  it("simulates the useEffect resync logic to ensure typing state is not clobbered", () => {
    // Function that represents the state comparison logic inside the useEffect:
    // returns true if we should update local state with incoming value, false otherwise.
    function shouldResync(localVal: string, incomingValue: string[] | string | undefined): boolean {
      const incomingStr = Array.isArray(incomingValue) ? incomingValue.join(", ") : "";
      const localParsedStr = parseTextList(localVal).join(", ");
      return incomingStr !== localParsedStr;
    }

    // Step 1: User types "Đỗ"
    let localVal = "Đỗ";
    let parentVal = parseTextList(localVal); // ["Đỗ"]
    expect(shouldResync(localVal, parentVal)).toBe(false); // NO OVERWRITE

    // Step 2: User types space "Đỗ "
    localVal = "Đỗ ";
    parentVal = parseTextList(localVal); // ["Đỗ"]
    expect(shouldResync(localVal, parentVal)).toBe(false); // NO OVERWRITE, space preserved!

    // Step 3: User types "Đỗ N"
    localVal = "Đỗ N";
    parentVal = parseTextList(localVal); // ["Đỗ N"]
    expect(shouldResync(localVal, parentVal)).toBe(false); // NO OVERWRITE

    // Step 4: User types comma "Đỗ N, "
    localVal = "Đỗ N, ";
    parentVal = parseTextList(localVal); // ["Đỗ N"]
    expect(shouldResync(localVal, parentVal)).toBe(false); // NO OVERWRITE, comma preserved!

    // Step 5: External change (parent changes members from template switch or external load)
    localVal = "Đỗ N, ";
    parentVal = ["An", "Bình"];
    expect(shouldResync(localVal, parentVal)).toBe(true); // OVERWRITE!
  });
});
