import React from "react";
import { Plus, Upload, ArrowLeft } from "lucide-react";

interface EmptyReportHubProps {
  onCreateSection: () => void;
  onImportMarkdown: () => void;
  onRestart: () => void;
}

export function EmptyReportHub({
  onCreateSection,
  onImportMarkdown,
  onRestart,
}: EmptyReportHubProps) {
  return (
    <div className="ws-empty-hub">
      <div className="ws-empty-hub-header">
        <h2 className="ws-empty-hub-title">Báo cáo chưa có nội dung</h2>
        <p className="ws-empty-hub-subtitle">
          Chọn một trong các phương thức bên dưới để bắt đầu xây dựng nội dung báo cáo của bạn.
        </p>
      </div>

      <div className="ws-empty-hub-grid">
        <button
          type="button"
          className="ws-empty-hub-card"
          onClick={onCreateSection}
          aria-label="Thêm mục đầu tiên để viết"
        >
          <div className="ws-empty-hub-icon-wrapper ws-color-primary">
            <Plus size={24} aria-hidden="true" />
          </div>
          <div className="ws-empty-hub-card-content">
            <h3 className="ws-empty-hub-card-title">Thêm mục đầu tiên</h3>
            <p className="ws-empty-hub-card-desc">
              Tạo một mục trống mới để bắt đầu tự viết nội dung báo cáo.
            </p>
          </div>
        </button>

        <button
          type="button"
          className="ws-empty-hub-card"
          onClick={onImportMarkdown}
          aria-label="Nhập nội dung từ file Markdown hoặc dán văn bản"
        >
          <div className="ws-empty-hub-icon-wrapper ws-color-success">
            <Upload size={24} aria-hidden="true" />
          </div>
          <div className="ws-empty-hub-card-content">
            <h3 className="ws-empty-hub-card-title">Nhập Markdown</h3>
            <p className="ws-empty-hub-card-desc">
              Tải lên tệp Markdown hiện có hoặc dán văn bản từ clipboard.
            </p>
          </div>
        </button>

        <button
          type="button"
          className="ws-empty-hub-card"
          onClick={onRestart}
          aria-label="Quay lại màn hình khởi tạo dự án ban đầu"
        >
          <div className="ws-empty-hub-icon-wrapper ws-color-info">
            <ArrowLeft size={24} aria-hidden="true" />
          </div>
          <div className="ws-empty-hub-card-content">
            <h3 className="ws-empty-hub-card-title">Quay lại khởi tạo</h3>
            <p className="ws-empty-hub-card-desc">
              Trở lại trang bắt đầu để chọn mẫu báo cáo hoặc tạo dàn ý bằng AI.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
