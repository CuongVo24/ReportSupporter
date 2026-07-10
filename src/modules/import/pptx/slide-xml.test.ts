// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  parsePresentationOrder,
  parseSlideXml,
  parseNotesPathFromRels,
  parseNotesSlideXml,
} from "./slide-xml";

describe("PPTX Slide XML Parser Core", () => {
  it("should parse presentation slide order correctly from presentation XML and rels", () => {
    const presentationXml = `
      <p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <p:sldIdLst>
          <p:sldId id="256" r:id="rIdOrder1"/>
          <p:sldId id="257" r:id="rIdOrder2"/>
        </p:sldIdLst>
      </p:presentation>
    `;
    const relsXml = `
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdOrder2" Type="..." Target="slides/slide2.xml"/>
        <Relationship Id="rIdOrder1" Type="..." Target="/slides/slide1.xml"/>
      </Relationships>
    `;

    const order = parsePresentationOrder(presentationXml, relsXml);
    expect(order).toEqual(["ppt/slides/slide1.xml", "ppt/slides/slide2.xml"]);
  });

  it("should parse a normal slide XML with title and bullet points correctly", () => {
    const slideXml = `
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:cSld>
          <p:spTree>
            <!-- Title shape -->
            <p:sp>
              <p:nvSpPr>
                <p:nvPr>
                  <p:ph type="title"/>
                </p:nvPr>
              </p:nvSpPr>
              <p:txBody>
                <a:p>
                  <a:r>
                    <a:t>Tiêu đề Slide mẫu</a:t>
                  </a:r>
                </a:p>
              </p:txBody>
            </p:sp>
            <!-- Body shape -->
            <p:sp>
              <p:txBody>
                <a:p>
                  <a:r>
                    <a:t>Nội dung dòng 1</a:t>
                  </a:r>
                </a:p>
                <a:p>
                  <a:pPr lvl="1"/>
                  <a:r>
                    <a:t>Nội dung dòng 2 thụt lề 1</a:t>
                  </a:r>
                </a:p>
              </p:txBody>
            </p:sp>
          </p:spTree>
        </p:cSld>
      </p:sld>
    `;

    const parsed = parseSlideXml(slideXml);
    expect(parsed.title).toBe("Tiêu đề Slide mẫu");
    expect(parsed.paragraphs).toEqual([
      { text: "Nội dung dòng 1", indentLevel: 0 },
      { text: "Nội dung dòng 2 thụt lề 1", indentLevel: 1 },
    ]);
  });

  it("should concatenate multi-run text segments inside a paragraph correctly", () => {
    const slideXml = `
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:sp>
          <p:txBody>
            <a:p>
              <a:r><a:t>Xin </a:t></a:r>
              <a:r><a:t>chào </a:t></a:r>
              <a:r><a:t>Việt Nam</a:t></a:r>
            </a:p>
          </p:txBody>
        </p:sp>
      </p:sld>
    `;
    const parsed = parseSlideXml(slideXml);
    expect(parsed.paragraphs[0].text).toBe("Xin chào Việt Nam");
  });

  it("should handle nested bullet list levels from lvl attribute correctly", () => {
    const slideXml = `
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:sp>
          <p:txBody>
            <a:p>
              <a:pPr lvl="0"/>
              <a:r><a:t>Level 0</a:t></a:r>
            </a:p>
            <a:p>
              <a:pPr lvl="2"/>
              <a:r><a:t>Level 2</a:t></a:r>
            </a:p>
          </p:txBody>
        </p:sp>
      </p:sld>
    `;
    const parsed = parseSlideXml(slideXml);
    expect(parsed.paragraphs).toEqual([
      { text: "Level 0", indentLevel: 0 },
      { text: "Level 2", indentLevel: 2 },
    ]);
  });

  it("should support ctrTitle placeholder type for slide headers", () => {
    const slideXml = `
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:sp>
          <p:nvSpPr>
            <p:nvPr>
              <p:ph type="ctrTitle"/>
            </p:nvPr>
          </p:nvSpPr>
          <p:txBody>
            <a:p>
              <a:r><a:t>Center Title Slide</a:t></a:r>
            </a:p>
          </p:txBody>
        </p:sp>
      </p:sld>
    `;
    const parsed = parseSlideXml(slideXml);
    expect(parsed.title).toBe("Center Title Slide");
  });

  it("should resolve notes slide path from relationship definition", () => {
    const slideRelsXml = `
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide1.xml"/>
      </Relationships>
    `;
    const resolved = parseNotesPathFromRels(slideRelsXml, "ppt/slides/slide1.xml");
    expect(resolved).toBe("ppt/notesSlides/notesSlide1.xml");
  });

  it("should extract notes slide text from notes placeholder shape", () => {
    const notesXml = `
      <p:notes xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:sp>
          <p:nvSpPr>
            <p:nvPr>
              <p:ph type="notes"/>
            </p:nvPr>
          </p:nvSpPr>
          <p:txBody>
            <a:p>
              <a:r><a:t>Ghi chú slide 1</a:t></a:r>
            </a:p>
            <a:p>
              <a:r><a:t>Thêm một dòng nữa</a:t></a:r>
            </a:p>
          </p:txBody>
        </p:sp>
      </p:notes>
    `;
    const notesText = parseNotesSlideXml(notesXml);
    expect(notesText).toBe("Ghi chú slide 1\nThêm một dòng nữa");
  });

  it("should handle slide with missing title correctly", () => {
    const slideXml = `
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:sp>
          <p:txBody>
            <a:p>
              <a:r><a:t>Chỉ có body text, không có title placeholder</a:t></a:r>
            </a:p>
          </p:txBody>
        </p:sp>
      </p:sld>
    `;
    const parsed = parseSlideXml(slideXml);
    expect(parsed.title).toBeUndefined();
    expect(parsed.paragraphs[0].text).toBe("Chỉ có body text, không có title placeholder");
  });

  it("should skip empty paragraphs or elements containing only whitespaces", () => {
    const slideXml = `
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:sp>
          <p:txBody>
            <a:p>
              <a:r><a:t>   </a:t></a:r>
            </a:p>
            <a:p>
              <a:r><a:t>Valid Text</a:t></a:r>
            </a:p>
          </p:txBody>
        </p:sp>
      </p:sld>
    `;
    const parsed = parseSlideXml(slideXml);
    expect(parsed.paragraphs.length).toBe(1);
    expect(parsed.paragraphs[0].text).toBe("Valid Text");
  });

  it("should support XMLs with custom or default namespaces", () => {
    const slideXml = `
      <sld>
        <sp>
          <nvSpPr>
            <ph type="title"/>
          </nvSpPr>
          <txBody>
            <p>
              <r><t>No namespace prefix title</t></r>
            </p>
          </txBody>
        </sp>
      </sld>
    `;
    const parsed = parseSlideXml(slideXml);
    expect(parsed.title).toBe("No namespace prefix title");
  });
});
