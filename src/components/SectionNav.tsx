"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  ChevronLeft,
  Pencil,
  Plus,
  Trash,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type SectionNavSection = {
  id: string;
  title: string;
  status: "draft" | "review" | "done";
};

type SectionNavProps = {
  sections: SectionNavSection[];
  activeSectionId: string;
  onSectionSelect: (id: string) => void;
  isDesktop: boolean;
  onCollapse?: () => void;
  onAddSection?: () => void;
  onRenameSection?: (id: string, title: string) => void;
  onDeleteSection?: (id: string) => void;
  onMoveSection?: (id: string, direction: "up" | "down") => void;
  onReorderSection?: (activeId: string, overId: string) => void;
  onSectionFilesDrop?: (id: string, files: File[]) => void;
};

type SortableSectionNavItemProps = {
  section: SectionNavSection;
  index: number;
  sectionCount: number;
  isActive: boolean;
  isEditing: boolean;
  isDropTarget: boolean;
  editTitle: string;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  onSectionSelect: (id: string) => void;
  onStartRename: (id: string, currentTitle: string) => void;
  onRenameSubmit: (id: string) => void;
  onEditTitleChange: (value: string) => void;
  onCancelEdit: () => void;
  onMoveSection?: (id: string, direction: "up" | "down") => void;
  onRenameSection?: (id: string, title: string) => void;
  onDeleteSection?: (id: string) => void;
  onReorderSection?: (activeId: string, overId: string) => void;
  onSectionFilesDrop?: (id: string, files: File[]) => void;
  onDropTargetChange: (id: string | null) => void;
};

function SortableSectionNavItem({
  section,
  index,
  sectionCount,
  isActive,
  isEditing,
  isDropTarget,
  editTitle,
  editInputRef,
  onSectionSelect,
  onStartRename,
  onRenameSubmit,
  onEditTitleChange,
  onCancelEdit,
  onMoveSection,
  onRenameSection,
  onDeleteSection,
  onReorderSection,
  onSectionFilesDrop,
  onDropTargetChange,
}: SortableSectionNavItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: !onReorderSection || isEditing });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const className = [
    "ws-section-nav-item-container",
    isActive ? "active" : "",
    isDropTarget ? "ws-section-nav-item-drop-target" : "",
    isDragging ? "ws-section-nav-item-dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleDragOver = (event: React.DragEvent) => {
    if (!event.dataTransfer.types.includes("Files") || !onSectionFilesDrop) return;
    event.preventDefault();
    onDropTargetChange(section.id);
  };

  const handleDrop = (event: React.DragEvent) => {
    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0 || !onSectionFilesDrop) return;
    event.preventDefault();
    event.stopPropagation();
    onDropTargetChange(null);
    onSectionFilesDrop(section.id, files);
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      onDragOver={handleDragOver}
      onDragLeave={() => onDropTargetChange(null)}
      onDrop={handleDrop}
    >
      <div className={className}>
        {onReorderSection && !isEditing && (
          <button
            type="button"
            className="ws-section-nav-drag-handle"
            aria-label={`Keo sap xep muc ${index + 1}: ${section.title}`}
            title="Keo sap xep muc"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} aria-hidden="true" />
          </button>
        )}

        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            className="ws-section-nav-edit-input"
            value={editTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            onBlur={() => onRenameSubmit(section.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRenameSubmit(section.id);
              if (e.key === "Escape") onCancelEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            maxLength={100}
            aria-label="Nhap tieu de muc moi"
          />
        ) : (
          <button
            className={`ws-section-nav-item ${isActive ? "ws-section-nav-item-active" : ""}`}
            onClick={() => onSectionSelect(section.id)}
            onDoubleClick={() => onStartRename(section.id, section.title)}
            aria-current={isActive ? "page" : undefined}
            aria-label={`${index + 1}. ${section.title}`}
            title={`${index + 1}. ${section.title}`}
          >
            <span className="ws-section-nav-item-text">
              <span className="ws-section-nav-item-index" aria-hidden="true">{index + 1}.</span>
              <span className="ws-section-nav-item-title">{section.title}</span>
            </span>
            {!isActive && <Badge group="status" value={section.status} />}
          </button>
        )}

        {isActive && !isEditing && (
          <div className="ws-section-nav-item-actions">
            {onMoveSection && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveSection(section.id, "up");
                  }}
                  disabled={index === 0}
                  aria-label="Di chuyen len"
                  title="Di chuyen len"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveSection(section.id, "down");
                  }}
                  disabled={index === sectionCount - 1}
                  aria-label="Di chuyen xuong"
                  title="Di chuyen xuong"
                >
                  <ChevronDown size={12} />
                </button>
              </>
            )}
            {onRenameSection && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartRename(section.id, section.title);
                }}
                aria-label="Doi ten muc"
                title="Doi ten muc"
              >
                <Pencil size={12} />
              </button>
            )}
            {onDeleteSection && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSection(section.id);
                }}
                aria-label="Xoa muc"
                title="Xoa muc"
              >
                <Trash size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function SectionNav({
  sections,
  activeSectionId,
  onSectionSelect,
  isDesktop,
  onCollapse,
  onAddSection,
  onRenameSection,
  onDeleteSection,
  onMoveSection,
  onReorderSection,
  onSectionFilesDrop,
}: SectionNavProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleRenameSubmit = (id: string) => {
    const trimmed = editTitle.trim();
    if (trimmed && onRenameSection) {
      onRenameSection(id, trimmed);
    }
    setEditingId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderSection) return;
    onReorderSection(String(active.id), String(over.id));
  };

  const list = (
    <ul className="ws-section-nav-list">
      {sections.map((section, index) => (
        <SortableSectionNavItem
          key={section.id}
          section={section}
          index={index}
          sectionCount={sections.length}
          isActive={section.id === activeSectionId}
          isEditing={section.id === editingId}
          isDropTarget={dropTargetId === section.id}
          editTitle={editTitle}
          editInputRef={editInputRef}
          onSectionSelect={onSectionSelect}
          onStartRename={handleStartRename}
          onRenameSubmit={handleRenameSubmit}
          onEditTitleChange={setEditTitle}
          onCancelEdit={() => setEditingId(null)}
          onMoveSection={onMoveSection}
          onRenameSection={onRenameSection}
          onDeleteSection={onDeleteSection}
          onReorderSection={onReorderSection}
          onSectionFilesDrop={onSectionFilesDrop}
          onDropTargetChange={setDropTargetId}
        />
      ))}
    </ul>
  );

  return (
    <div className="ws-section-nav-content">
      <div className="ws-section-nav-header">
        <span className="ws-section-nav-title">Muc luc</span>
        <div style={{ display: "flex", gap: "var(--rs-space-1)", alignItems: "center" }}>
          {onAddSection && (
            <button
              type="button"
              className="ws-section-nav-action-btn"
              onClick={onAddSection}
              aria-label="Them muc moi"
              title="Them muc moi"
            >
              <Plus size={14} />
            </button>
          )}
          {isDesktop && onCollapse && (
            <button
              type="button"
              className="ws-column-toggle-btn"
              onClick={onCollapse}
              aria-label="Thu gon muc luc"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
      </div>
      {onReorderSection ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
            {list}
          </SortableContext>
        </DndContext>
      ) : list}
    </div>
  );
}
