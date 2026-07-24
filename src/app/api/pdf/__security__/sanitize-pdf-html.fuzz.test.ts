// W25-K (S4): adversarial corpus for the regex-based PDF HTML filter.
//
// 🔒 This filter is a defense-in-depth pass, NOT the primary security
// boundary — the PDF renderer's JS-disabled + network-blocked isolation is
// (see Design/Security/ThreatModel.md T3). These tests both (a) prove the
// cases the regex *does* catch stay caught, and (b) pin down two known
// bypasses as characterization/regression baselines so nobody re-labels
// this regex a complete boundary later. Fixing the bypasses is out of scope
// for this test/docs contract — a fix would need a real HTML parser and is
// tracked as an open item in ThreatModel T3.
import { describe, expect, it } from "vitest";
import { mulberry32, pick, randomString } from "@/test/fuzz-utils";
import { sanitizePdfHtml } from "../sanitize-pdf-html";

describe("sanitizePdfHtml — cases it correctly strips", () => {
  it("removes a plain <script> block", () => {
    const out = sanitizePdfHtml('<p>hi</p><script>document.body.textContent="SCRIPT_RAN"</script>');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("SCRIPT_RAN");
  });

  it("removes quoted inline event handlers regardless of case", () => {
    expect(sanitizePdfHtml(`<img src="a.png" onerror="alert(1)">`)).not.toContain("onerror");
    expect(sanitizePdfHtml(`<img src="a.png" ONERROR="alert(1)">`)).not.toContain("ONERROR");
    expect(sanitizePdfHtml(`<body onload='alert(1)'>`)).not.toContain("onload");
  });

  it("blanks absolute http(s) src/href on img/link", () => {
    expect(sanitizePdfHtml(`<img src="https://evil.example/tracker.png">`)).toContain(`src=""`);
    expect(sanitizePdfHtml(`<link href="http://evil.example/x.css">`)).toContain(`href=""`);
  });

  it("bounded fuzz: seeded combinations of script/event-handler/link noise never leave a runnable script tag", () => {
    const rand = mulberry32(20260724);
    const scriptVariants = [
      "<script>alert(1)</script>",
      "<SCRIPT>alert(1)</SCRIPT>",
      "<script type=\"text/javascript\">alert(1)</script>",
      "<script\n>alert(1)</script>",
      "<script src=\"https://evil.example/x.js\"></script>",
    ];
    for (let i = 0; i < 40; i++) {
      const noise = randomString(rand, 12, "abc<>=\"' /");
      const input = `${noise}${pick(rand, scriptVariants)}${noise}`;
      const out = sanitizePdfHtml(input);
      expect(out.toLowerCase()).not.toContain("<script");
    }
  });
});

describe("sanitizePdfHtml — known bypasses (documented residual risk, not a passing security claim)", () => {
  it("does NOT strip an unquoted event handler attribute", () => {
    // Regex requires a quoted value: \son[a-z]+\s*=\s*("...""|'...'). Unquoted
    // attributes slip through untouched. Renderer JS-off is what actually
    // neutralizes this — see ThreatModel T3.
    const input = `<img src=a.png onerror=alert(1)>`;
    const out = sanitizePdfHtml(input);
    expect(out).toContain("onerror=alert(1)");
  });

  it("does NOT blank a protocol-relative img/link src", () => {
    // Regex only matches literal http:// or https://; "//host/path" resolves
    // in-browser against the page protocol and is left untouched.
    const input = `<img src="//evil.example/tracker.png">`;
    const out = sanitizePdfHtml(input);
    expect(out).toContain(`src="//evil.example/tracker.png"`);
  });
});
