"use client";

import React, { useState, useEffect, useRef, ReactNode } from "react";
import {
  Menu,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  FileText,
  ChevronDown,
} from "lucide-react";
import { SectionNav } from "./SectionNav";
import { MobileDrawer } from "./MobileDrawer";
import { Select } from "@/components/ui";
import "./WorkspaceLayout.css";

type WorkspaceLayoutProps = {
  editor: ReactNode;
  preview: ReactNode;
  sidePanel: ReactNode;
  sections: { id: string; title: string; status: "draft" | "review" | "done" }[];
  activeSectionId: string;
  onSectionSelect: (id: string) => void;
  reportTitle: string;
  saveStatus?: ReactNode;
  primaryAction?: ReactNode;
};

export function WorkspaceLayout({
  editor,
  preview,
  sidePanel,
  sections,
  activeSectionId,
  onSectionSelect,
  reportTitle,
  saveStatus,
  primaryAction,
}: WorkspaceLayoutProps) {
  const [isDesktop, setIsDesktop] = useState(true);
  const [isWide, setIsWide] = useState(true);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  const [splitWidth, setSplitWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [zoomMode, setZoomMode] = useState<string>("fit");

  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const desktopMedia = window.matchMedia("(min-width: 1024px)");
    const wideMedia = window.matchMedia("(min-width: 1440px)");
    setIsDesktop(desktopMedia.matches);
    setIsWide(wideMedia.matches);

    const desktopListener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    const wideListener = (e: MediaQueryListEvent) => setIsWide(e.matches);

    desktopMedia.addEventListener("change", desktopListener);
    wideMedia.addEventListener("change", wideListener);

    return () => {
      desktopMedia.removeEventListener("change", desktopListener);
      wideMedia.removeEventListener("change", wideListener);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const offset = e.clientX - rect.left;
      const percentage = (offset / rect.width) * 100;
      const minPercentage = (320 / rect.width) * 100;
      const maxPercentage = 100 - minPercentage;
      setSplitWidth(Math.max(minPercentage, Math.min(maxPercentage, percentage)));
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const inner = innerRef.current;
    if (!viewport || !inner) return;
    const updateScale = () => {
      let nextScale = 1;
      if (zoomMode === "fit") {
        const availableWidth = viewport.clientWidth - 48; // padding
        const a4Width = 794;
        if (availableWidth < a4Width) {
          nextScale = Math.max(0.6, availableWidth / a4Width); // Ngưỡng đọc tối thiểu là 0.6
        }
      } else if (zoomMode === "75") {
        nextScale = 0.75;
      } else if (zoomMode === "100" || zoomMode === "actual") {
        nextScale = 1.0;
      } else if (zoomMode === "125") {
        nextScale = 1.25;
      }
      setScale(nextScale);
      setHeight(inner.clientHeight * nextScale);
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [activeTab, splitWidth, isDesktop, zoomMode]);

  const handleSectionClick = (id: string) => {
    onSectionSelect(id);
    setIsLeftDrawerOpen(false);
  };

  const navContent = (
    <SectionNav
      sections={sections}
      activeSectionId={activeSectionId}
      onSectionSelect={handleSectionClick}
      isDesktop={isDesktop}
      onCollapse={() => setIsLeftCollapsed(true)}
    />
  );

  return (
    <div className="ws-shell">
      <header className="ws-topbar">
        <div className="ws-topbar-left">
          {!isDesktop && (
            <button type="button" className="ws-column-toggle-btn" onClick={() => setIsLeftDrawerOpen(true)} aria-label="Mở mục lục">
              <Menu size={16} />
            </button>
          )}
          <span className="ws-brand">ReportSupporter</span>
          <div className="ws-report-switcher">
            <span className="ws-report-title" title={reportTitle}>{reportTitle}</span>
            <ChevronDown className="ws-report-switcher-chevron" size={16} aria-hidden="true" />
          </div>
        </div>
        <div className="ws-topbar-center">{saveStatus}</div>
        <div className="ws-topbar-right">
          {primaryAction}
          {(!isDesktop || (isDesktop && !isWide)) && (
            <button type="button" className="ws-column-toggle-btn" onClick={() => setIsRightDrawerOpen(true)} aria-label="Mở bảng điều khiển">
              <Menu size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="ws-main-layout">
        {isDesktop && (
          <aside className={`ws-side-column ws-side-column-left ${isLeftCollapsed ? "ws-side-column-left--collapsed" : "ws-side-column-left--expanded"}`} aria-label="Mục lục">
            {isLeftCollapsed ? (
              <div className="ws-collapsed-rail-list">
                <button type="button" className="ws-column-toggle-btn" onClick={() => setIsLeftCollapsed(false)} aria-label="Mở rộng mục lục">
                  <PanelLeftOpen size={16} />
                </button>
                <div className="ws-collapsed-rail-list ws-collapsed-rail-list-spaced">
                  {sections.map((sec, idx) => (
                    <button
                      key={sec.id}
                      className={`ws-collapsed-rail-item ${sec.id === activeSectionId ? "ws-collapsed-rail-item-active" : ""}`}
                      onClick={() => onSectionSelect(sec.id)}
                      title={sec.title}
                    >
                      <span className="ws-collapsed-rail-index">{idx + 1}</span>
                      <span className={`ws-collapsed-rail-badge ws-badge-status-${sec.status}`} />
                    </button>
                  ))}
                </div>
              </div>
            ) : navContent}
          </aside>
        )}

        <section className="ws-workspace-core" aria-label="Khu vực làm việc">
          {!isDesktop && (
            <div className="ws-responsive-tabs">
              <button type="button" className={`ws-responsive-tab-btn ${activeTab === "editor" ? "ws-responsive-tab-btn-active" : ""}`} onClick={() => setActiveTab("editor")}>
                Bàn viết
              </button>
              <button type="button" className={`ws-responsive-tab-btn ${activeTab === "preview" ? "ws-responsive-tab-btn-active" : ""}`} onClick={() => setActiveTab("preview")}>
                Tờ nộp
              </button>
            </div>
          )}

          {isDesktop ? (
            <div className="ws-split-pane-container" ref={containerRef}>
              <div className="ws-split-pane-editor" style={{ width: `${splitWidth}%` }}>{editor}</div>
              <div className="ws-split-divider" onMouseDown={handleMouseDown} />
              <div className="ws-split-pane-preview ws-preview" ref={viewportRef} style={{ width: `${100 - splitWidth}%` }}>
                <div className="ws-preview-zoom-control">
                  <span className="ws-preview-zoom-label">Zoom: {Math.round(scale * 100)}%</span>
                  <Select
                    value={zoomMode}
                    onValueChange={setZoomMode}
                    ariaLabel="Chọn tỷ lệ zoom"
                    options={[
                      { value: "fit", label: "Tự động" },
                      { value: "75", label: "75%" },
                      { value: "100", label: "100%" },
                      { value: "125", label: "125%" },
                      { value: "actual", label: "Kích thước thực" },
                    ]}
                    size="sm"
                    fullWidth={false}
                  />
                </div>
                <div className="ws-preview-scale-wrapper" style={{ transform: `scale(${scale})`, height: height ? `${height}px` : "auto" }}>
                  <div ref={innerRef} className="ws-preview-page">{preview}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="ws-responsive-container">
              {activeTab === "editor" ? (
                <div className="ws-responsive-editor-scroll">{editor}</div>
              ) : (
                <div className="ws-preview-viewport" ref={viewportRef}>
                  <div className="ws-preview-scale-wrapper" style={{ transform: `scale(${scale})`, height: height ? `${height}px` : "auto" }}>
                    <div ref={innerRef} className="ws-preview-page">{preview}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {isDesktop && isWide && (
          <aside className={`ws-side-column ws-side-column-right ${isRightCollapsed ? "ws-side-column-right--collapsed" : "ws-side-column-right--expanded"}`} aria-label="Bảng điều khiển">
            {isRightCollapsed ? (
              <div className="ws-collapsed-rail-list">
                <button type="button" className="ws-column-toggle-btn" onClick={() => setIsRightCollapsed(false)} aria-label="Mở rộng bảng điều khiển">
                  <PanelRightOpen size={16} />
                </button>
                <div className="ws-collapsed-rail-list ws-collapsed-rail-list-spaced">
                  <button type="button" className="ws-collapsed-rail-item" onClick={() => setIsRightCollapsed(false)} title="Mở bảng điều khiển">
                    <FileText size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="ws-side-inner-right">
                <div className="ws-side-column-right-toggle-wrapper">
                  <button type="button" className="ws-column-toggle-btn" onClick={() => setIsRightCollapsed(true)} aria-label="Thu gọn bảng điều khiển">
                    <PanelRightClose size={16} />
                  </button>
                </div>
                <div className="ws-side-panel-content-scroll">{sidePanel}</div>
              </div>
            )}
          </aside>
        )}
      </main>

      {!isDesktop && (
        <MobileDrawer isOpen={isLeftDrawerOpen} onClose={() => setIsLeftDrawerOpen(false)} side="left" title="Mục lục">
          {navContent}
        </MobileDrawer>
      )}
      {(!isDesktop || (isDesktop && !isWide)) && (
        <MobileDrawer isOpen={isRightDrawerOpen} onClose={() => setIsRightDrawerOpen(false)} side="right" title="Bảng điều khiển">
          {sidePanel}
        </MobileDrawer>
      )}
    </div>
  );
}
