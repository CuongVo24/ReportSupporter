import { describe, it, expect, beforeAll } from "vitest";
import JSZip from "jszip";
import {
  scanImageReferences,
  getBasename,
  isEvidencePath,
  rewriteMarkdownRefs,
  ingestAssetsAndEvidence,
  WARNING_ASSET_SIZE_BYTES,
  MAX_ASSET_SIZE_BYTES,
  MAX_ZIP_ENTRIES,
  unzipFiles,
} from "./import-assets";


describe("import-assets logic", () => {
  beforeAll(() => {
    // Mock FileReader for testing in environment
    class MockFileReader {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      result: string = "data:image/png;base64,mockdata";
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 5);
      }
    }
    global.FileReader = MockFileReader as unknown as typeof FileReader;
  });

  describe("scanImageReferences", () => {
    it("scans relative references from markdown and HTML tag", () => {
      const markdown = `
# Báo cáo
![Ảnh 1](Figures/hinh_1.png)
Một đoạn text.
![Ảnh 2](./assets/sub/hinh_2.jpg)
Link ngoài: ![Link](https://google.com/logo.png)
Data URI: ![Data](data:image/png;base64,123)
Asset link: ![Asset](asset:abcd-1234)

HTML image: <img src="UniVillage_Final_Evidence/hinh_3.png" alt="Evidence" />
HTML link ngoài: <img src="http://example.com/other.png">
      `;
      const refs = scanImageReferences(markdown);
      expect(refs).toContain("Figures/hinh_1.png");
      expect(refs).toContain("./assets/sub/hinh_2.jpg");
      expect(refs).toContain("UniVillage_Final_Evidence/hinh_3.png");
      expect(refs).not.toContain("https://google.com/logo.png");
      expect(refs).not.toContain("data:image/png;base64,123");
      expect(refs).not.toContain("asset:abcd-1234");
      expect(refs).not.toContain("http://example.com/other.png");
      expect(refs.length).toBe(3);
    });
  });

  describe("getBasename", () => {
    it("extracts filename from Unix and Windows paths", () => {
      expect(getBasename("a/b/c.png")).toBe("c.png");
      expect(getBasename("a\\b\\d.jpg")).toBe("d.jpg");
      expect(getBasename("just-name.svg")).toBe("just-name.svg");
    });
  });

  describe("isEvidencePath", () => {
    it("detects evidence paths correctly", () => {
      expect(isEvidencePath("UniVillage_Final_Evidence/hinh_1.png")).toBe(true);
      expect(isEvidencePath("Figures/minh_chung_detail.png")).toBe(true);
      expect(isEvidencePath("Appendix/detail.png")).toBe(true);
      expect(isEvidencePath("Figures/normal_workflow.png")).toBe(false);
    });
  });

  describe("rewriteMarkdownRefs", () => {
    it("rewrites markdown and html tags accurately", () => {
      const markdown = `
![Workflow](Figures/hinh_1.png)
<img src="UniVillage_Final_Evidence/hinh_3.png" />
      `;
      const replacements = [
        { original: "Figures/hinh_1.png", assetId: "id1" },
        { original: "UniVillage_Final_Evidence/hinh_3.png", assetId: "id2" },
      ];
      const result = rewriteMarkdownRefs(markdown, replacements);
      expect(result).toContain("![Workflow](asset:id1)");
      expect(result).toContain('<img src="asset:id2" />');
    });
  });

  describe("ingestAssetsAndEvidence", () => {
    it("matches files by basename and populates assets and evidence list", async () => {
      const markdown = `
![H1](Figures/hinh_1.png)
![H2](UniVillage_Final_Evidence/hinh_2.png)
![H3](missing_image.png)
      `;

      // Mock File objects
      const file1 = {
        name: "hinh_1.png",
        size: 500 * 1024,
        type: "image/png",
      } as unknown as File;

      const file2 = {
        name: "hinh_2.png",
        size: 1.5 * 1024 * 1024,
        type: "image/png",
      } as unknown as File;

      const result = await ingestAssetsAndEvidence(markdown, [file1, file2]);

      expect(result.summary.totalScanned).toBe(3);
      expect(result.summary.embeddedCount).toBe(2);
      expect(result.summary.missingCount).toBe(1);
      expect(result.summary.missingList).toContain("missing_image.png");

      expect(result.assets.length).toBe(2);
      expect(result.assets[0].fileName).toBe("hinh_1.png");
      expect(result.assets[1].fileName).toBe("hinh_2.png");

      // Evidence extraction
      expect(result.evidence.length).toBe(1);
      expect(result.evidence[0].title).toBe("Hinh 2");
      expect(result.evidence[0].url).toContain("asset:");

      // Markdown rewrite
      expect(result.markdown).toContain(`![H1](asset:${result.assets[0].id})`);
      expect(result.markdown).toContain(`![H2](asset:${result.assets[1].id})`);
      expect(result.markdown).toContain(`![H3](missing_image.png)`);
    });

    it("enforces warnings and size limit filters", async () => {
      const markdown = `![Large](big.png) \n ![TooBig](giant.png)`;

      const bigFile = {
        name: "big.png",
        size: WARNING_ASSET_SIZE_BYTES + 100, // slightly over 2MB
        type: "image/png",
      } as unknown as File;

      const giantFile = {
        name: "giant.png",
        size: MAX_ASSET_SIZE_BYTES + 100, // over 5MB
        type: "image/png",
      } as unknown as File;

      const result = await ingestAssetsAndEvidence(markdown, [bigFile, giantFile]);

      expect(result.summary.embeddedCount).toBe(1);
      expect(result.summary.missingCount).toBe(1); // giant is skipped, hence missing
      expect(result.summary.missingList).toContain("giant.png");
      expect(result.assets.length).toBe(1);

      // Warning size trigger
      expect(result.summary.warnings.some((w) => w.includes("big.png") && w.includes("Cảnh báo"))).toBe(true);
      // Hard limit trigger
      expect(result.summary.warnings.some((w) => w.includes("giant.png") && w.includes("Bỏ qua"))).toBe(true);
    });

    it("prefers an exact normalized relative path over duplicate basenames", async () => {
      const exact = { name: "docs/a/diagram.png", size: 10, type: "image/png" } as File;
      const duplicate = { name: "docs/b/diagram.png", size: 10, type: "image/png" } as File;
      const result = await ingestAssetsAndEvidence("![Diagram](./docs/a/diagram.png)", [duplicate, exact]);
      expect(result.summary.resolutions[0]).toMatchObject({
        status: "exact",
        selectedFileId: "docs/a/diagram.png",
      });
      expect(result.assets[0].fileName).toBe("docs/a/diagram.png");
    });

    it("requires a review decision when duplicate basenames are ambiguous", async () => {
      const first = { name: "folder-a/diagram.png", size: 10, type: "image/png" } as File;
      const second = { name: "folder-b/diagram.png", size: 10, type: "image/png" } as File;
      const unresolved = await ingestAssetsAndEvidence("![Diagram](assets/diagram.png)", [first, second]);
      expect(unresolved.summary.resolutions[0].status).toBe("ambiguous");
      expect(unresolved.assets).toHaveLength(0);

      const resolved = await ingestAssetsAndEvidence(
        "![Diagram](assets/diagram.png)",
        [first, second],
        { assetSelections: { "assets/diagram.png": "folder-b/diagram.png" } },
      );
      expect(resolved.assets[0].fileName).toBe("folder-b/diagram.png");
    });
  });

  describe("unzipFiles", () => {
    it("extracts a normal archive", async () => {
      const zip = new JSZip();
      zip.file("report.md", "# Report");
      zip.file("images/example.png", new Uint8Array([1, 2, 3]));
      zip.file("images/vector.svg", "<svg/>");
      const blob = await zip.generateAsync({ type: "blob" });

      const files = await unzipFiles(new File([blob], "report.zip", { type: "application/zip" }));

      expect(files.map((file) => file.name)).toEqual(["report.md", "images/example.png", "images/vector.svg"]);
      expect(files[0].type).toBe("text/markdown");
      expect(files[1].type).toBe("image/png");
      expect(files[2].type).toBe("image/svg+xml");
    });

    it("rejects archives with too many entries before decompression", async () => {
      const zip = new JSZip();
      for (let index = 0; index <= MAX_ZIP_ENTRIES; index++) {
        zip.file(`entry-${index}.md`, "x");
      }
      const blob = await zip.generateAsync({ type: "blob" });

      await expect(
        unzipFiles(new File([blob], "too-many.zip", { type: "application/zip" })),
      ).rejects.toThrow(String(MAX_ZIP_ENTRIES));
    });
  });
});
