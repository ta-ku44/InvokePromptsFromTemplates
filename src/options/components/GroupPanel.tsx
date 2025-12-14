import React, { useState, useEffect } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import type { Group, Template } from '../../types/index.ts';
import Icons from '../assets/icons.ts';
import TemplateRow from './TemplateRow.tsx';

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
  overTemplateId?: number | null;
  dropPosition?: 'before' | 'after';
  isHeaderDropTarget?: boolean;
  isAddBtnDropTarget?: boolean;
  isCrossGroupDrag?: boolean;
  groupDraggableId?: string;
  isGroupDragging?: boolean;
  isGroupDropTarget?: boolean;
  groupDropPosition?: 'before' | 'after';
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
  overTemplateId = null,
  dropPosition = 'before',
  isHeaderDropTarget = false,
  isAddBtnDropTarget = false,
  isCrossGroupDrag = false,
  isGroupDragging = false,
  isGroupDropTarget = false,
  groupDropPosition = 'before',
  groupDraggableId,
}) => {
  const [isEditing, setIsEditing] = useState(startEditing);
  const [editName, setEditName] = useState(group.name);

  const { setNodeRef: setHeaderDropRef } = useDroppable({
    id: `group-header-${group.id}`,
    data: { type: 'group-header', groupId: group.id },
  });

  const { setNodeRef: setAddBtnDropRef } = useDroppable({
    id: `group-add-btn-${group.id}`,
    data: { type: 'group-add-btn', groupId: group.id },
  });

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
  console.log('activeTemplateId:', activeTemplateId, 'isNull:', activeTemplateId == null);

  return (
    <>
      {isGroupDropTarget && groupDropPosition === 'before' && (
        <div className="group-drop-dummy" />
      )}

      <div 
        className={`group-item ${isGroupDragging ? 'dragging' : ''}`}
        style={isGroupDragging ? { opacity: 0.3 } : undefined}
      >
        <div 
          ref={node => {
            setHeaderDropRef(node);
            setDragRef(node);
          }}
          className={`group-header
            ${isHeaderDropTarget ? 'header-drop-target' : ''}
            ${activeTemplateId != null ? 'template-dragging' : ''}
          `}
          {...attributes}
          {...listeners}
          onClick={() => {
            // ドラッグ中は開閉しない
            if (!isEditing && !isGroupDragging) onToggle();
          }}
          onMouseEnter={(e) => {
            if (activeTemplateId != null) e.stopPropagation();
          }}
        >
          <button 
            className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
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
              className="group-name-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span className="group-name">
              <span
                className="group-name-text"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleDoubleClick(e);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {group.name}
              </span>
            </span>
          )}

          <div className="group-header-spacer" />

          <div className="group-actions">
            <button
              className="icon-btn delete"
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

        {isExpanded && !isGroupDragging && (
          <div 
            className={`templates-container ${isCrossGroupDrag ? 'group-drop-target' : ''}`}
          >
            {isHeaderDropTarget && (
              <div className="drop-line-top" />
            )}
            
            {sortedTemplates.map((template) => (
              <TemplateRow
                key={template.id}
                template={template}
                onEdit={onEdit}
                onDelete={onDeleteTemplate}
                onNameChange={onTemplateNameChange}
                isDragging={activeTemplateId === template.id}
                isDropTarget={overTemplateId === template.id}
                dropPosition={dropPosition}
              />
            ))}

            <div className="add-template-wrapper">
              {isAddBtnDropTarget && (
                <div className="drop-line-bottom" />
              )}
              <button 
                ref={setAddBtnDropRef}
                className="add-template-btn"
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

      {isGroupDropTarget && groupDropPosition === 'after' && (
        <div className="group-drop-dummy" />
      )}
    </>
  );
};

export default GroupPanel;