import { describe, expect, it } from "vitest";
import { codeLanguageRule } from "./code-language";

describe("codeLanguageRule", () => {
  it("has the canonical rule id and severity (3.Check.md §5.2)", () => {
    expect(codeLanguageRule.id).toBe("code-block-no-lang");
    expect(codeLanguageRule.severity).toBe("warning");
  });

  it("flags a fenced block opened without a language", () => {
    const md = "Vi du:\n```\nconst x = 1;\n```\n";
    const issues = codeLanguageRule.run(md);
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("code-block-no-lang");
    expect(issues[0].line).toBe(2);
  });

  it("returns [] when the fence declares a language", () => {
    const md = "Vi du:\n```ts\nconst x = 1;\n```\n";
    expect(codeLanguageRule.run(md)).toEqual([]);
  });

  it("does not treat the closing fence as a new block", () => {
    const md = "```js\nok\n```\n```\nbad\n```\n";
    const issues = codeLanguageRule.run(md);
    expect(issues).toHaveLength(1);
    expect(issues[0].line).toBe(4);
  });
});
