import React from "react";
import type { DefenseQA, ReportSection } from "@/types";

interface DefenseQAViewProps {
  qas: DefenseQA[];
  sections: ReportSection[];
}

export function DefenseQAView({ qas, sections }: DefenseQAViewProps) {
  const topics: { key: DefenseQA["topic"]; label: string }[] = [
    { key: "scope", label: "🎯 Phạm vi & Mục tiêu (Scope)" },
    { key: "tech", label: "💻 Công nghệ & Kiến trúc (Tech)" },
    { key: "result", label: "📊 Kết quả thực nghiệm (Result)" },
    { key: "limitation", label: "⚠️ Hạn chế & Khó khăn (Limitation)" },
    { key: "future", label: "🚀 Hướng đi tương lai (Future)" },
  ];

  if (qas.length === 0) {
    return (
      <div className="ws-present-qa-view" aria-label="Phản biện">
        <h4 className="ws-present-view-title">Câu hỏi phản biện khả dĩ (Defense Q&A)</h4>
        <p className="ws-present-qa-empty">
          Chưa tìm thấy từ khóa hoặc tín hiệu tương thích trong báo cáo để gợi ý câu hỏi phản biện.
        </p>
      </div>
    );
  }

  return (
    <div className="ws-present-qa-view" aria-label="Phản biện">
      <h4 className="ws-present-view-title">Câu hỏi phản biện khả dĩ (Defense Q&A)</h4>
      <div className="ws-present-qa-topics-list">
        {topics.map((t) => {
          const topicQAs = qas.filter((qa) => qa.topic === t.key);
          if (topicQAs.length === 0) return null;

          return (
            <div key={t.key} className="ws-present-qa-topic-group">
              <h5 className="ws-present-qa-topic-header">{t.label}</h5>
              <div className="ws-present-qa-items">
                {topicQAs.map((item) => {
                  const section = sections.find((s) => s.id === item.relatedSectionId);

                  return (
                    <div key={item.id} className="ws-present-qa-item">
                      <div className="ws-present-qa-question">
                        <strong>Q: </strong> {item.question}
                      </div>

                      <div className="ws-present-qa-answer">
                        <strong>Gợi ý trả lời: </strong>
                        <p className="ws-present-qa-answer-text">{item.suggestedAnswer}</p>
                      </div>

                      <div className="ws-present-qa-footer">
                        {section && (
                          <span className="ws-present-qa-section-link">
                            📍 Tham chiếu mục: <strong>{section.title}</strong>
                          </span>
                        )}
                        <button
                          disabled
                          className="ws-present-qa-ai-btn"
                          title="Tính năng tối ưu bằng AI sẽ khả dụng ở tuần 11"
                        >
                          ✨ Cải thiện câu trả lời bằng AI (W11)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
