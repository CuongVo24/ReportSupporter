import { describe, expect, it } from "vitest";
import { extractEmbeddedAssets } from "./extract-assets";

describe("extractEmbeddedAssets", () => {
  it("extracts inline markdown base64 images and rewrites refs", async () => {
    const markdown = "Hello, here is a small red dot image: ![Red Dot](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==). Check it out.";
    const result = await extractEmbeddedAssets(markdown, "custom-prefix");

    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].fileName).toBe("custom-prefix-1.png");
    expect(result.assets[0].mimeType).toBe("image/png");
    expect(result.assets[0].data).toBe("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==");
    expect(result.markdown).toContain(`![Red Dot](asset:${result.assets[0].id})`);
    expect(result.warnings).toHaveLength(0);
  });

  it("extracts inline HTML img tags and rewrites refs", async () => {
    const html = `<div>
      <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP" alt="Test JPEG" />
    </div>`;
    const result = await extractEmbeddedAssets(html);

    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].fileName).toBe("imported-image-1.jpg");
    expect(result.assets[0].mimeType).toBe("image/jpeg");
    expect(result.markdown).toContain(`<img src="asset:${result.assets[0].id}" alt="Test JPEG" />`);
    expect(result.warnings).toHaveLength(0);
  });

  it("extracts both Markdown and HTML images, maintaining unique asset IDs and consecutive file names", async () => {
    const content = `
    ![Markdown One](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA)
    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
    `;
    const result = await extractEmbeddedAssets(content, "multi");

    expect(result.assets).toHaveLength(2);
    expect(result.assets[0].fileName).toBe("multi-1.png");
    expect(result.assets[1].fileName).toBe("multi-2.gif");
    expect(result.markdown).toContain(`![Markdown One](asset:${result.assets[0].id})`);
    expect(result.markdown).toContain(`<img src="asset:${result.assets[1].id}" />`);
    expect(result.warnings).toHaveLength(0);
  });

  it("skips base64 images that exceed the size limit and generates a warning", async () => {
    // 5MB limit is 5 * 1024 * 1024 bytes = 5,242,880 bytes.
    // Base64 length = approx bytes * 4 / 3. So 5.1MB needs approx 7,130,000 chars.
    const largeBase64 = "a".repeat(7.2 * 1024 * 1024);
    const content = `![Too Big](data:image/png;base64,${largeBase64})`;

    const result = await extractEmbeddedAssets(content);

    expect(result.assets).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].code).toBe("image-skipped");
    expect(result.warnings[0].message).toContain("Bỏ qua hình ảnh nhúng");
    expect(result.warnings[0].message).toContain("vượt quá giới hạn 5MB");
    expect(result.markdown).toContain("![Too Big](image-skipped)");
  });

  it("does not rewrite regular image paths", async () => {
    const content = `
    ![Remote Image](https://example.com/assets/img.png)
    ![Relative Image](../images/local.jpg)
    `;
    const result = await extractEmbeddedAssets(content);

    expect(result.assets).toHaveLength(0);
    expect(result.markdown).toBe(content);
    expect(result.warnings).toHaveLength(0);
  });
});
