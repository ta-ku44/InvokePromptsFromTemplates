import React, { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Group, Template } from '../../types/index.ts';
import Icons from '../assets/icons.ts';
import TemplateRow from './TemplateRow.tsx';
import DropGap from './DropGap.tsx';

interface GroupPanelProps {
  group: Group;
  templates: Template[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (template: Template) => void;
  onDeleteTemplate: (id: number) => void;
  onTemplateNameChange: (id: number, name: string) => void;
  onGroupNameChange: (id: number, name: string) => void;
  onDeleteGroup: (id: number) => void;
  onAddTemplate: (groupId: number) => void;
  startEditing?: boolean;
  onEditingComplete?: () => void;
  activeTemplateId?: number | null;
  activeGapId?: string | null;
  groupDraggableId?: string;
  isGroupDragging?: boolean;
}

const GroupPanel: React.FC<GroupPanelProps> = ({
  group,
  templates,
  isExpanded,
  onToggle,
  onEdit,
  onDeleteTemplate,
  onTemplateNameChange,
  onGroupNameChange,
  onDeleteGroup,
  onAddTemplate,
  startEditing = false,
  onEditingComplete,
  activeTemplateId = null,
  activeGapId = null,
  isGroupDragging = false,
  groupDraggableId,
}) => {
  const [isEditing, setIsEditing] = useState(startEditing);
  const [editName, setEditName] = useState(group.name);

  const { setNodeRef: setDragRef, attributes, listeners } = useDraggable({
    id: groupDraggableId ?? `group-${group.id}`,
    data: { type: 'group', groupId: group.id },
  });

  useEffect(() => {
    if (startEditing) {
      setIsEditing(true);
    }
  }, [startEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(group.name);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (!editName.trim()) {
      setEditName(group.name);
    } else if (editName.trim() !== group.name) {
      onGroupNameChange(group.id, editName.trim());
    }
    onEditingComplete?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(group.name);
      onEditingComplete?.();
    }
  };

  const sortedTemplates = [...templates].sort((a, b) => a.order - b.order);

  return (
    <div
      className={`group ${isGroupDragging ? 'group--dragging' : ''}`}
    >
      {/* グループヘッダー */}
      <div
        ref={setDragRef}
        className={`group__header ${activeTemplateId != null ? 'group__header--template-dragging' : ''}`}
        {...attributes}
        {...listeners}
        onClick={() => {
          if (!isEditing && !isGroupDragging) onToggle();
        }}
      >
        <button
          className={`button--expand ${isExpanded ? 'button--expand--expanded' : ''}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (!isEditing && !isGroupDragging) onToggle();
          }}
        >
          <Icons.ExpandMore />
        </button>

        {isEditing ? (
          <input
            type="text"
            className="group__name-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div className="group__name">
            <span
              className="group__name-text"
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleDoubleClick(e);
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {group.name}
            </span>
          </div>
        )}

        <div className="group__actions">
          <button
            className="button--icon button--icon--delete"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteGroup(group.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="グループを削除"
            tabIndex={-1}
          >
            <Icons.Delete />
          </button>
        </div>
      </div>

      {/* テンプレート一覧 */}
      {isExpanded && !isGroupDragging && (
        <div className="group__templates">
          <DropGap
            type="template"
            groupId={group.id}
            indexOrId={0}
            isActive={activeGapId === `gap-${group.id}-0`}
          />

          {sortedTemplates.map((template, idx) => (
            <React.Fragment key={template.id}>
              <TemplateRow
                template={template}
                onEdit={onEdit}
                onDelete={onDeleteTemplate}
                onNameChange={onTemplateNameChange}
                isDragging={activeTemplateId === template.id}
              />

              <DropGap
                type="template"
                groupId={group.id}
                indexOrId={idx + 1}
                isActive={activeGapId === `gap-${group.id}-${idx + 1}`}
              />
            </React.Fragment>
          ))}

          <div className="add-template-wrapper" style={{ marginTop: '8px' }}>
            <button
              className="button button--add-template"
              onClick={(e) => {
                e.stopPropagation();
                onAddTemplate(group.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Icons.Add />
              テンプレートを追加
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupPanel;