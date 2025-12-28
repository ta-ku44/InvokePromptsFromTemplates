import React, { useState, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { type Template } from '../../types/index.ts';
import DragHandle from './DragHandle.tsx';
import Icons from '../assets/icons.ts';

interface TemplateRowProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (id: number) => void;
  onNameChange: (id: number, name: string) => void;
  isDragging?: boolean;
  disabled?: boolean;
}

const TemplateRow: React.FC<TemplateRowProps> = ({
  template,
  onEdit,
  onDelete,
  onNameChange,
  isDragging = false,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(template.name);

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
  } = useDraggable({
    id: `template-${template.id}`,
    data: { type: 'template', template },
    disabled,
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `template-${template.id}`,
    data: { type: 'template', template },
    disabled,
  });

  const setNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef]
  );

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditName(template.name);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editName !== template.name) {
      onNameChange(template.id, editName.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(template.name);
    }
  };

  const isNameEmpty = !template.name.trim();

  return (
    <div 
      ref={setNodeRef} 
      className={`template ${isDragging ? 'template--dragging' : ''}`}
    >
      <DragHandle listeners={listeners} attributes={attributes} />
      
      {isEditing ? (
        <input
          type="text"
          className="template__name-input"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <div className="template__name" onDoubleClick={handleDoubleClick}>
          {isNameEmpty ? (
            <>
              <span className="template__name-required">*</span>
              <span className="template__name-empty">(名前なし)</span>
            </>
          ) : (
            template.name
          )}
        </div>
      )}

      <div className="template__actions">
        <button 
          className="button--icon" 
          onClick={() => onEdit(template)} 
          title="編集"
        >
          <Icons.Edit />
        </button>
        <button 
          className="button--icon button--icon--delete" 
          onClick={() => onDelete(template.id)} 
          title="削除"
        >
          <Icons.Delete />
        </button>
      </div>
    </div>
  );
};

export default TemplateRow;