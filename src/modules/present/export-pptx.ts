import type { SlideOutline, Speaker, SpeakerScript } from "@/types";

export async function buildPptx(
  slides: SlideOutline[],
  speakers: Speaker[],
  scripts: Record<string, SpeakerScript>,
  opts?: { author?: string; title?: string }
): Promise<Blob> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  pptx.author = opts?.author || "ReportSupporter";
  pptx.title = opts?.title || "Presentation";

  for (const slide of slides) {
    const slideObj = pptx.addSlide();

    // 1. Title
    slideObj.addText(slide.title, {
      x: 0.5,
      y: 0.5,
      w: "90%",
      h: 1.0,
      fontSize: 32,
      bold: true,
      color: "363636",
    });

    // 2. Bullets
    if (slide.bullets && slide.bullets.length > 0) {
      const bulletLines = slide.bullets.map((bullet) => ({
        text: bullet,
        options: { bullet: true },
      }));
      slideObj.addText(bulletLines, {
        x: 0.5,
        y: 1.8,
        w: "90%",
        h: 4.2,
        fontSize: 18,
        color: "4A4A4A",
      });
    }

    // 3. Speaker footer details
    const speakerName = speakers.find((s) => s.id === slide.speakerId)?.name || "";
    if (speakerName) {
      slideObj.addText(`Người trình bày: ${speakerName}`, {
        x: 0.5,
        y: 6.3,
        w: "50%",
        h: 0.4,
        fontSize: 12,
        italic: true,
        color: "7F7F7F",
      });
    }

    // 4. Speaker notes
    const noteText = scripts[slide.id]?.script || "";
    if (noteText) {
      slideObj.addNotes(noteText);
    }
  }

  const blob = await pptx.write({ outputType: "blob" });
  return blob as Blob;
}
