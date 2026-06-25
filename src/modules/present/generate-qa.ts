import type { ReportSection, EvidenceItem, DefenseQA } from "@/types";

/**
 * Normalizes text by removing markdown formatting and collapsing whitespace.
 */
function cleanText(text: string): string {
  return text
    .replace(/[#*`_~[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits text into sentences based on standard punctuation.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Finds the first sentence containing any of the keywords.
 */
function findSentenceWithKeywords(sentences: string[], keywords: string[]): string | undefined {
  return sentences.find((s) => {
    const lower = s.toLowerCase();
    return keywords.some((kw) => lower.includes(kw));
  });
}

/**
 * Deterministically generates suggested defense Q&A items based on section content and evidence.
 */
export function generateDefenseQA(
  sections: ReportSection[],
  evidence: EvidenceItem[] = []
): DefenseQA[] {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const qas: DefenseQA[] = [];

  for (const section of sortedSections) {
    if (!section.markdown || section.markdown.trim() === "") continue;

    const cleanedContent = cleanText(section.markdown);
    const sentences = splitSentences(cleanedContent);

    // 1. Scope topic
    const scopeKeywords = ["mục tiêu", "phạm vi", "yêu cầu", "đặc tả", "giới hạn", "đề tài"];
    const scopeSentence = findSentenceWithKeywords(sentences, scopeKeywords);
    if (scopeSentence) {
      qas.push({
        id: `qa-${section.id}-scope`,
        topic: "scope",
        question: "Mục tiêu và phạm vi của đề tài được giới hạn như thế nào?",
        suggestedAnswer: scopeSentence.endsWith(".") ? scopeSentence : `${scopeSentence}.`,
        relatedSectionId: section.id,
      });
    }

    // 2. Tech topic
    const techKeywords = [
      "công nghệ",
      "ngôn ngữ",
      "framework",
      "thư viện",
      "database",
      "kiến trúc",
      "deploy",
      "triển khai",
      "cài đặt",
      "setup",
      "docker",
      "github",
      "git",
    ];
    const techSentence = findSentenceWithKeywords(sentences, techKeywords);

    // Check if there is deployment or source code evidence referenced or matches keywords
    const deployEvidence = evidence.find(
      (e) => e.kind === "deploy" || e.title.toLowerCase().includes("deploy")
    );
    const hasDeploySignal =
      deployEvidence &&
      (cleanedContent.toLowerCase().includes("deploy") ||
        cleanedContent.toLowerCase().includes("triển khai"));

    if (techSentence || hasDeploySignal) {
      let question = "Hệ thống sử dụng các công nghệ, framework hay cơ sở dữ liệu nào làm nền tảng?";
      let suggestedAnswer = techSentence
        ? techSentence.endsWith(".")
          ? techSentence
          : `${techSentence}.`
        : "Hệ thống đã triển khai và cấu hình môi trường chạy thực tế.";

      if (hasDeploySignal) {
        question = "Quy trình triển khai và môi trường công nghệ của hệ thống được thiết lập như thế nào?";
        const evNote = ` Dự án có đính kèm minh chứng triển khai: ${deployEvidence.title}${
          deployEvidence.url ? ` tại ${deployEvidence.url}` : ""
        }.`;
        suggestedAnswer += evNote;
      }

      qas.push({
        id: `qa-${section.id}-tech`,
        topic: "tech",
        question,
        suggestedAnswer,
        relatedSectionId: section.id,
      });
    }

    // 3. Result topic
    const resultKeywords = ["kết quả", "thử nghiệm", "đánh giá", "báo cáo", "đạt được", "hoàn thành", "sản phẩm"];
    const resultSentence = findSentenceWithKeywords(sentences, resultKeywords);
    if (resultSentence) {
      qas.push({
        id: `qa-${section.id}-result`,
        topic: "result",
        question: "Kết quả thực nghiệm hoặc các chức năng chính đã hoàn thiện của dự án là gì?",
        suggestedAnswer: resultSentence.endsWith(".") ? resultSentence : `${resultSentence}.`,
        relatedSectionId: section.id,
      });
    }

    // 4. Limitation topic
    const limitKeywords = ["hạn chế", "nhược điểm", "khó khăn", "chưa đạt được", "thiếu sót", "vấn đề", "rào cản"];
    const limitSentence = findSentenceWithKeywords(sentences, limitKeywords);
    if (limitSentence) {
      qas.push({
        id: `qa-${section.id}-limitation`,
        topic: "limitation",
        question: "Những khó khăn hay hạn chế nào còn tồn tại trong giải pháp hiện tại?",
        suggestedAnswer: limitSentence.endsWith(".") ? limitSentence : `${limitSentence}.`,
        relatedSectionId: section.id,
      });
    }

    // 5. Future topic
    const futureKeywords = ["tương lai", "phát triển", "nâng cấp", "mở rộng", "tiếp theo", "hướng đi", "roadmap"];
    const futureSentence = findSentenceWithKeywords(sentences, futureKeywords);
    if (futureSentence) {
      qas.push({
        id: `qa-${section.id}-future`,
        topic: "future",
        question: "Hướng phát triển tiếp theo hoặc kế hoạch nâng cấp của đề tài là gì?",
        suggestedAnswer: futureSentence.endsWith(".") ? futureSentence : `${futureSentence}.`,
        relatedSectionId: section.id,
      });
    }
  }

  return qas;
}
