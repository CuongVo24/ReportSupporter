import React from "react";
import type { DefenseQA, ReportSection } from "@/types";
import { Target, Laptop, BarChart3, AlertTriangle, Rocket, MapPin, Sparkles } from "lucide-react";

interface DefenseQAViewProps {
  qas: DefenseQA[];
  sections: ReportSection[];
}

export function DefenseQAView({ qas, sections }: DefenseQAViewProps) {
  const topics = [
    { key: "scope", label: "Phạm vi & Mục tiêu (Scope)", icon: Target },
    { key: "tech", label: "Công nghệ & Kiến trúc (Tech)", icon: Laptop },
    { key: "result", label: "Kết quả thực nghiệm (Result)", icon: BarChart3 },
    { key: "limitation", label: "Hạn chế & Khó khăn (Limitation)", icon: AlertTriangle },
    { key: "future", label: "Hướng đi tương lai (Future)", icon: Rocket },
  ] as const;

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
              <h5 className="ws-present-qa-topic-header" style={{ display: "inline-flex", alignItems: "center", gap: "var(--rs-space-1)" }}>
                <t.icon size={14} /> {t.label}
              </h5>
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
                          <span className="ws-present-qa-section-link" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <MapPin size={12} /> Tham chiếu mục: <strong>{section.title}</strong>
                          </span>
                        )}
                        <button
                          disabled
                          className="ws-present-qa-ai-btn"
                          title="Tính năng tối ưu bằng AI sẽ khả dụng ở tuần 11"
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Sparkles size={12} /> Cải thiện câu trả lời bằng AI (W11)
                          </span>
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
