import type { SlideOutline, EvidenceItem, SpeakerScript } from "@/types";

/**
 * Deterministically generates speaker scripts and action cues for slides.
 * Cues are extracted from evidence references and figure/table captions in content.
 */
export function generateSpeakerScript(
  outline: SlideOutline[],
  evidence: EvidenceItem[] = []
): SpeakerScript[] {
  return outline.map((slide) => {
    // Generate script narrative from title and bullets
    let script = `Sau đây, chúng ta sẽ cùng tìm hiểu về phần: ${slide.title}.`;
    if (slide.bullets && slide.bullets.length > 0) {
      script += ` Trong phần này, tôi xin trình bày các nội dung chính sau đây: `;
      const bulletTexts = slide.bullets.map((b, i) => {
        let cleanBullet = b.trim();
        if (cleanBullet.endsWith(".")) {
          cleanBullet = cleanBullet.slice(0, -1);
        }
        return `Ý thứ ${i + 1} là, ${cleanBullet}`;
      });
      script += bulletTexts.join(". ") + ".";
    }

    const cues: string[] = [];
    const addedCues = new Set<string>();

    // 1. Map evidence references to "mở demo <title>"
    if (slide.evidenceRefs && slide.evidenceRefs.length > 0) {
      for (const ref of slide.evidenceRefs) {
        const item = evidence.find((e) => e.id === ref);
        const title = item ? item.title : ref;
        const cueText = `mở demo ${title}`;
        if (!addedCues.has(cueText)) {
          cues.push(cueText);
          addedCues.add(cueText);
        }
      }
    }

    // 2. Scan captions (Hình/Bảng) in title and bullets
    const captionRegex = /(Hình\s+\d+(?:\.\d+)*|Bảng\s+\d+(?:\.\d+)*)/g;
    const foundCaptions = new Set<string>();

    const titleMatches = slide.title.match(captionRegex);
    if (titleMatches) {
      titleMatches.forEach((m) => foundCaptions.add(m));
    }

    if (slide.bullets) {
      for (const bullet of slide.bullets) {
        const bulletMatches = bullet.match(captionRegex);
        if (bulletMatches) {
          bulletMatches.forEach((m) => foundCaptions.add(m));
        }
      }
    }

    for (const cap of foundCaptions) {
      const cueText = `chỉ vào ${cap}`;
      if (!addedCues.has(cueText)) {
        cues.push(cueText);
        addedCues.add(cueText);
      }
    }

    return {
      slideId: slide.id,
      speakerId: slide.speakerId,
      script,
      cues,
    };
  });
}
