import { DOMParser } from "@xmldom/xmldom";

export interface ParsedSlide {
  title?: string;
  paragraphs: { text: string; indentLevel: number }[];
}

/**
 * Parses presentation.xml and presentation.xml.rels to resolve slides in their defined order.
 */
export function parsePresentationOrder(presentationXml: string, relsXml: string): string[] {
  const parser = new DOMParser();
  const presDoc = parser.parseFromString(presentationXml, "application/xml");
  const relsDoc = parser.parseFromString(relsXml, "application/xml");

  // Create relationship mapping: Id -> Target
  const relMap = new Map<string, string>();
  const relsNS = relsDoc.getElementsByTagNameNS("*", "Relationship");
  const relEls = relsNS.length > 0 ? relsNS : relsDoc.getElementsByTagName("Relationship");
  for (let i = 0; i < relEls.length; i++) {
    const id = relEls[i].getAttribute("Id");
    const target = relEls[i].getAttribute("Target");
    if (id && target) {
      // Normalize target path relative to the slide contents
      let normalized = target;
      if (normalized.startsWith("/")) {
        normalized = normalized.slice(1);
      }
      if (!normalized.startsWith("ppt/")) {
        normalized = "ppt/" + normalized;
      }
      relMap.set(id, normalized);
    }
  }

  // Retrieve ordered relationship ids from sldIdLst
  const sldIds: string[] = [];
  const sldIdEls = presDoc.getElementsByTagNameNS("*", "sldId");
  
  // Fallback for namespaced nodes if namespace-aware querying yields nothing
  const elements = sldIdEls.length > 0 ? sldIdEls : presDoc.getElementsByTagName("p:sldId");

  for (let i = 0; i < elements.length; i++) {
    let rId =
      elements[i].getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") ||
      elements[i].getAttribute("r:id");

    if (!rId) {
      const attrs = elements[i].attributes;
      for (let j = 0; j < attrs.length; j++) {
        const attr = attrs[j];
        if (attr.localName === "id" || attr.name === "r:id" || attr.name.endsWith(":id")) {
          rId = attr.value;
          break;
        }
      }
    }

    if (rId) {
      sldIds.push(rId);
    }
  }

  return sldIds.map((id) => relMap.get(id)).filter((path): path is string => !!path);
}

/**
 * Parses slide XML structure into titles and indent-ordered body paragraphs.
 */
export function parseSlideXml(slideXmlStr: string): ParsedSlide {
  const parser = new DOMParser();
  const doc = parser.parseFromString(slideXmlStr, "application/xml");

  let title: string | undefined;
  const paragraphs: { text: string; indentLevel: number }[] = [];

  const shapes = doc.getElementsByTagNameNS("*", "sp");
  const elements = shapes.length > 0 ? shapes : doc.getElementsByTagName("p:sp");

  for (let i = 0; i < elements.length; i++) {
    const sp = elements[i];

    // Check if placeholder is a title or center title
    const phEls = sp.getElementsByTagNameNS("*", "ph");
    const phElements = phEls.length > 0 ? phEls : sp.getElementsByTagName("p:ph");
    let isTitle = false;

    if (phElements.length > 0) {
      const typeAttr = phElements[0].getAttribute("type");
      if (typeAttr === "title" || typeAttr === "ctrTitle") {
        isTitle = true;
      }
    }

    const txBodyEls = sp.getElementsByTagNameNS("*", "txBody");
    const txBodyElements = txBodyEls.length > 0 ? txBodyEls : sp.getElementsByTagName("p:txBody");
    if (txBodyElements.length === 0) continue;

    const txBody = txBodyElements[0];
    const pEls = txBody.getElementsByTagNameNS("*", "p");
    const pElements = pEls.length > 0 ? pEls : txBody.getElementsByTagName("a:p");

    for (let j = 0; j < pElements.length; j++) {
      const p = pElements[j];

      // Extract text content from all text runs in this paragraph
      const tEls = p.getElementsByTagNameNS("*", "t");
      const tElements = tEls.length > 0 ? tEls : p.getElementsByTagName("a:t");
      let pText = "";
      for (let k = 0; k < tElements.length; k++) {
        pText += tElements[k].textContent || "";
      }

      if (!pText.trim()) continue;

      if (isTitle) {
        title = (title ? title + " " : "") + pText.trim();
      } else {
        // Read lvl attribute for list hierarchy
        const pPrEls = p.getElementsByTagNameNS("*", "pPr");
        const pPrElements = pPrEls.length > 0 ? pPrEls : p.getElementsByTagName("a:pPr");
        let indentLevel = 0;

        if (pPrElements.length > 0) {
          const lvlAttr = pPrElements[0].getAttribute("lvl");
          if (lvlAttr) {
            indentLevel = parseInt(lvlAttr, 10);
            if (isNaN(indentLevel)) indentLevel = 0;
          }
        }
        paragraphs.push({ text: pText.trim(), indentLevel });
      }
    }
  }

  return { title, paragraphs };
}

/**
 * Resolves notes path from slide relationship definition.
 */
export function parseNotesPathFromRels(slideRelsXml: string, slidePath: string): string | undefined {
  const parser = new DOMParser();
  const doc = parser.parseFromString(slideRelsXml, "application/xml");
  const relsNS = doc.getElementsByTagNameNS("*", "Relationship");
  const rels = relsNS.length > 0 ? relsNS : doc.getElementsByTagName("Relationship");

  for (let i = 0; i < rels.length; i++) {
    const type = rels[i].getAttribute("Type");
    const target = rels[i].getAttribute("Target");
    if (
      type === "http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" &&
      target
    ) {
      const parentDir = slidePath.split("/").slice(0, -1).join("/");
      const parts = parentDir.split("/");
      const targetParts = target.split("/");
      for (const t of targetParts) {
        if (t === "..") {
          parts.pop();
        } else if (t !== ".") {
          parts.push(t);
        }
      }
      return parts.join("/");
    }
  }

  return undefined;
}

/**
 * Extracts speaker notes texts from notes slide XML.
 */
export function parseNotesSlideXml(notesSlideXmlStr: string): string | undefined {
  const parser = new DOMParser();
  const doc = parser.parseFromString(notesSlideXmlStr, "application/xml");

  const shapes = doc.getElementsByTagNameNS("*", "sp");
  const elements = shapes.length > 0 ? shapes : doc.getElementsByTagName("p:sp");
  const notesText: string[] = [];

  for (let i = 0; i < elements.length; i++) {
    const sp = elements[i];

    // Check if placeholder is one of the excluded non-notes types
    const phEls = sp.getElementsByTagNameNS("*", "ph");
    const phElements = phEls.length > 0 ? phEls : sp.getElementsByTagName("p:ph");
    let isExcluded = false;

    if (phElements.length > 0) {
      const typeAttr = phElements[0].getAttribute("type");
      if (
        typeAttr === "sldImg" ||
        typeAttr === "sldNum" ||
        typeAttr === "hdr" ||
        typeAttr === "ftr" ||
        typeAttr === "dt"
      ) {
        isExcluded = true;
      }
    }

    if (!isExcluded) {
      const txBodyEls = sp.getElementsByTagNameNS("*", "txBody");
      const txBodyElements = txBodyEls.length > 0 ? txBodyEls : sp.getElementsByTagName("p:txBody");
      if (txBodyElements.length > 0) {
        const pEls = txBodyElements[0].getElementsByTagNameNS("*", "p");
        const pElements = pEls.length > 0 ? pEls : txBodyElements[0].getElementsByTagName("a:p");
        for (let j = 0; j < pElements.length; j++) {
          const tEls = pElements[j].getElementsByTagNameNS("*", "t");
          const tElements = tEls.length > 0 ? tEls : pElements[j].getElementsByTagName("a:t");
          let pText = "";
          for (let k = 0; k < tElements.length; k++) {
            pText += tElements[k].textContent || "";
          }
          if (pText.trim()) {
            notesText.push(pText.trim());
          }
        }
      }
    }
  }

  return notesText.length > 0 ? notesText.join("\n") : undefined;
}
