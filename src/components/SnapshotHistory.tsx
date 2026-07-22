"use client";

import { RefreshCw, RotateCcw, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui";
import type { SnapshotMetadata } from "@/modules/write";

type SnapshotHistoryProps = {
  // W24-M (S3): the list is driven by lightweight metadata (no bundle payload).
  snapshots: SnapshotMetadata[];
  onRefresh: () => void | Promise<void>;
  onRestore: (snapshot: SnapshotMetadata) => void;
  onCreateSnapshot?: () => void | Promise<void>;
  isLoading?: boolean;
};

function formatSnapshotTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SnapshotHistory({ snapshots, onRefresh, onRestore, onCreateSnapshot, isLoading = false }: SnapshotHistoryProps) {
  return (
    <section className="ws-snapshot-panel" aria-labelledby="ws-snapshot-title">
      <div className="ws-snapshot-header">
        <div>
          <p id="ws-snapshot-title" className="ws-snapshot-title">
            Lịch sử phiên bản
          </p>
          <p className="ws-snapshot-subtitle">{snapshots.length} bản đã lưu</p>
        </div>
        <div className="ws-snapshot-header-actions">
          {onCreateSnapshot && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void onCreateSnapshot()}
              leadingIcon={<BookmarkPlus size={14} aria-hidden="true" />}
              title="Lưu một mốc để có thể khôi phục về sau"
            >
              Tạo bản lưu
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void onRefresh()}
            aria-label="Làm mới lịch sử phiên bản"
            title="Làm mới"
          >
            <RefreshCw size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {snapshots.length === 0 ? (
        <p className="ws-snapshot-empty">
          Bản thảo đang được tự động lưu. Nhấn “Tạo bản lưu” để đánh dấu một mốc
          có thể khôi phục; hệ thống cũng tự tạo bản lưu trước mỗi thao tác rủi ro.
        </p>
      ) : (
        <ul className="ws-snapshot-list" aria-busy={isLoading}>
          {snapshots.map((snapshot) => (
            <li key={snapshot.id} className="ws-snapshot-item">
              <div className="ws-snapshot-meta">
                <span className="ws-snapshot-time">{formatSnapshotTime(snapshot.takenAt)}</span>
                <span className="ws-snapshot-reason">{snapshot.reason}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onRestore(snapshot)}
                leadingIcon={<RotateCcw size={14} aria-hidden="true" />}
              >
                Khôi phục
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
