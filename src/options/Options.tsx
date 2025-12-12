import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Template, Group } from '../types/index';
import {
  loadStoredData,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  addGroup,
  updateGroup,
  deleteGroup,
  reorderTemplates,
  reorderGroups,
  moveTemplateToGroup,
} from '../utils/storage';
import './Options.css';

// Icons
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

// Drag Handle Component (6 dots for templates only)
interface DragHandleProps {
  listeners?: React.HTMLAttributes<HTMLElement>;
  attributes?: React.HTMLAttributes<HTMLElement>;
}

const DragHandle: React.FC<DragHandleProps> = ({ listeners, attributes }) => (
  <div className="drag-handle" {...listeners} {...attributes}>
    <div className="drag-handle-dots">
      <span className="drag-handle-dot" />
      <span className="drag-handle-dot" />
    </div>
    <div className="drag-handle-dots">
      <span className="drag-handle-dot" />
      <span className="drag-handle-dot" />
    </div>
    <div className="drag-handle-dots">
      <span className="drag-handle-dot" />
      <span className="drag-handle-dot" />
    </div>
  </div>
);

// Draggable Template Item
interface DraggableTemplateProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (id: number) => void;
  onNameChange: (id: number, name: string) => void;
  isDropTarget?: boolean;
  isDraggingTemplate?: boolean;
  dropPosition?: 'before' | 'after';
}

const DraggableTemplate: React.FC<DraggableTemplateProps> = ({
  template,
  onEdit,
  onDelete,
  onNameChange,
  isDropTarget = false,
  isDraggingTemplate = false,
  dropPosition = 'before',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(template.name);

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ 
    id: `template-${template.id}`,
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `template-${template.id}`,
  });

  // 両方のrefを結合
  const setNodeRef = useCallback((node: HTMLDivElement | null) => {
    setDragRef(node);
    setDropRef(node);
  }, [setDragRef, setDropRef]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditName(template.name);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editName.trim() && editName !== template.name) {
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
  
  // ドロップターゲットのクラス名を決定
  const dropTargetClass = isDropTarget && isDraggingTemplate 
    ? (dropPosition === 'before' ? 'drop-target-line-before' : 'drop-target-line-after')
    : '';

  return (
    <div 
      ref={setNodeRef} 
      className={`template-wrapper ${dropTargetClass}`}
      style={{ opacity: isDragging ? 0 : 1 }}
    >
      <div className={`template-item ${isDragging ? 'dragging' : ''}`}>
        <DragHandle listeners={listeners} attributes={attributes} />
        {isEditing ? (
          <input
            type="text"
            className="template-name-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <span className="template-name" onDoubleClick={handleDoubleClick}>
            {isNameEmpty ? (
              <>
                <span className="name-required-indicator">*</span>
                <span className="name-empty">(名前なし)</span>
              </>
            ) : (
              template.name
            )}
          </span>
        )}
        <div className="template-actions">
          <button className="icon-btn" onClick={() => onEdit(template)} title="編集">
            <EditIcon />
          </button>
          <button className="icon-btn delete" onClick={() => onDelete(template.id)} title="削除">
            <DeleteIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

// Droppable area for a group (to receive templates)
interface DroppableGroupAreaProps {
  groupId: number;
  children: React.ReactNode;
  isOver: boolean;
}

const DroppableGroupArea: React.FC<DroppableGroupAreaProps> = ({ groupId, children, isOver }) => {
  const { setNodeRef } = useDroppable({
    id: `droppable-group-${groupId}`,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`templates-container ${isOver ? 'drop-target' : ''}`}
      data-group-id={groupId}
    >
      {children}
    </div>
  );
};

// Sortable Group Component
interface SortableGroupProps {
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
  isOver: boolean;
  overTemplateId: string | null;
  isDraggingTemplate: boolean;
  dropPosition: 'before' | 'after';
}

const SortableGroup: React.FC<SortableGroupProps> = ({
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
  isOver,
  overTemplateId,
  isDraggingTemplate,
  dropPosition,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ 
    id: `group-${group.id}`,
    animateLayoutChanges: () => false, // アニメーションを無効化
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: undefined, // transitionを無効化
    opacity: isDragging ? 0 : 1, // ドラッグ中は非表示（DragOverlayで表示）
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(group.name);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editName.trim() && editName !== group.name) {
      onGroupNameChange(group.id, editName.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(group.name);
    }
  };

  const sortedTemplates = [...templates].sort((a, b) => a.order - b.order);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group-item ${isDragging ? 'dragging' : ''}`}
    >
      <div
        className="group-header"
        {...attributes}
        {...listeners}
        onClick={() => {
          // シングルクリックでトグル（編集中は除く）
          if (!isEditing) {
            onToggle();
          }
        }}
      >
        <button
          className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
          onClick={() => {
            // ボタン自体は何もしない（ヘッダーのクリックでトグル）
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ChevronIcon />
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
          <span 
            className="group-name" 
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleDoubleClick(e);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {group.name}
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
          >
            <DeleteIcon />
          </button>
        </div>
      </div>
      {isExpanded && (
        <DroppableGroupArea groupId={group.id} isOver={isOver}>
          {sortedTemplates.map((template) => (
            <DraggableTemplate
              key={template.id}
              template={template}
              onEdit={onEdit}
              onDelete={onDeleteTemplate}
              onNameChange={onTemplateNameChange}
              isDropTarget={overTemplateId === `template-${template.id}`}
              isDraggingTemplate={isDraggingTemplate}
              dropPosition={dropPosition}
            />
          ))}
          <button
            className="add-template-btn"
            onClick={() => onAddTemplate(group.id)}
          >
            <PlusIcon />
            テンプレートを追加
          </button>
        </DroppableGroupArea>
      )}
    </div>
  );
};

// Template Edit Modal
interface TemplateModalProps {
  template: Template | null;
  groupId: number | null;
  onSave: (template: Partial<Template> & { groupId: number }) => void;
  onClose: () => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  template,
  groupId,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(template?.name || '');
  const [content, setContent] = useState(template?.content || '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: template?.id,
      groupId: template?.groupId ?? groupId!,
      name: name.trim(),
      content: content,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{template ? 'テンプレートを編集' : '新しいテンプレート'}</h2>
        <div className="modal-field">
          <label>テンプレート名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="テンプレート名を入力"
          />
        </div>
        <div className="modal-field">
          <label>内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="プロンプトの内容を入力"
          />
        </div>
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>
            キャンセル
          </button>
          <button className="modal-btn save" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Options Component
const Options: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [addingToGroupId, setAddingToGroupId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overGroupId, setOverGroupId] = useState<number | null>(null);
  const [overTemplateId, setOverTemplateId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('after');
  const isDraggingGroup = activeId?.startsWith('group-') ?? false;
  const isDraggingTemplate = activeId?.startsWith('template-') ?? false;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadData = useCallback(async () => {
    const data = await loadStoredData();
    setGroups([...data.groups].sort((a, b) => a.order - b.order));
    setTemplates(data.templates);
    setExpandedGroups(new Set(data.groups.map((g) => g.id)));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddGroup = async () => {
    await addGroup({ name: '新しいグループ' });
    await loadData();
  };

  const handleDeleteGroup = async (id: number) => {
    if (confirm('このグループとすべてのテンプレートを削除しますか？')) {
      await deleteGroup(id);
      await loadData();
    }
  };

  const handleGroupNameChange = async (id: number, name: string) => {
    await updateGroup(id, { name });
    await loadData();
  };

  const handleToggleGroup = (groupId: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleAddTemplate = (groupId: number) => {
    setAddingToGroupId(groupId);
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setAddingToGroupId(null);
    setIsModalOpen(true);
  };

  const handleDeleteTemplate = async (id: number) => {
    if (confirm('このテンプレートを削除しますか？')) {
      await deleteTemplate(id);
      await loadData();
    }
  };

  const handleTemplateNameChange = async (id: number, name: string) => {
    await updateTemplate(id, { name });
    await loadData();
  };

  const handleSaveTemplate = async (
    templateData: Partial<Template> & { groupId: number }
  ) => {
    if (templateData.id) {
      await updateTemplate(templateData.id, {
        name: templateData.name,
        content: templateData.content,
      });
    } else {
      await addTemplate({
        groupId: templateData.groupId,
        name: templateData.name || '',
        content: templateData.content || '',
      });
    }
    setIsModalOpen(false);
    setEditingTemplate(null);
    setAddingToGroupId(null);
    await loadData();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setAddingToGroupId(null);
  };

  const getTemplatesForGroup = (groupId: number) => {
    return templates.filter((t) => t.groupId === groupId);
  };

  // Get active item for drag overlay
  const getActiveTemplate = () => {
    if (!activeId || !activeId.startsWith('template-')) return null;
    const templateId = parseInt(activeId.replace('template-', ''));
    return templates.find((t) => t.id === templateId) || null;
  };

  const getActiveGroup = () => {
    if (!activeId || !activeId.startsWith('group-')) return null;
    const groupId = parseInt(activeId.replace('group-', ''));
    return groups.find((g) => g.id === groupId) || null;
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setOverGroupId(null);
      setOverTemplateId(null);
      return;
    }

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    // Only track group for template drags
    if (activeIdStr.startsWith('template-')) {
      if (overIdStr.startsWith('droppable-group-')) {
        const groupId = parseInt(overIdStr.replace('droppable-group-', ''));
        setOverGroupId(groupId);
        setOverTemplateId(null);
        setDropPosition('after');
      } else if (overIdStr.startsWith('template-')) {
        const templateId = parseInt(overIdStr.replace('template-', ''));
        const template = templates.find((t) => t.id === templateId);
        if (template) {
          setOverGroupId(template.groupId);
          setOverTemplateId(overIdStr);
          
          // 上下の位置判定
          const activeTemplateId = parseInt(activeIdStr.replace('template-', ''));
          const activeTemplate = templates.find((t) => t.id === activeTemplateId);
          if (activeTemplate && activeTemplate.groupId === template.groupId) {
            // 同じグループ内での移動
            const groupTemplates = templates
              .filter((t) => t.groupId === template.groupId)
              .sort((a, b) => a.order - b.order);
            const activeIndex = groupTemplates.findIndex((t) => t.id === activeTemplateId);
            const overIndex = groupTemplates.findIndex((t) => t.id === templateId);
            setDropPosition(activeIndex < overIndex ? 'after' : 'before');
          } else {
            // 別グループへの移動は常にbefore
            setDropPosition('before');
          }
        }
      } else {
        setOverGroupId(null);
        setOverTemplateId(null);
      }
    } else {
      setOverTemplateId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    const currentDropPosition = dropPosition;
    
    setActiveId(null);
    setOverGroupId(null);
    setOverTemplateId(null);

    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    // Handle group reordering
    if (activeIdStr.startsWith('group-') && overIdStr.startsWith('group-')) {
      const activeGroupId = parseInt(activeIdStr.replace('group-', ''));
      const overGroupId = parseInt(overIdStr.replace('group-', ''));
      
      if (activeGroupId !== overGroupId) {
        const oldIndex = groups.findIndex((g) => g.id === activeGroupId);
        const newIndex = groups.findIndex((g) => g.id === overGroupId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newGroups = arrayMove(groups, oldIndex, newIndex);
          setGroups(newGroups);
          await reorderGroups(newGroups.map((g) => g.id));
        }
      }
      return;
    }

    // Handle template reordering/moving
    if (activeIdStr.startsWith('template-')) {
      const activeTemplateId = parseInt(activeIdStr.replace('template-', ''));
      const activeTemplate = templates.find((t) => t.id === activeTemplateId);
      
      if (!activeTemplate) return;

      // Dropped on a droppable group area
      if (overIdStr.startsWith('droppable-group-')) {
        const targetGroupId = parseInt(overIdStr.replace('droppable-group-', ''));
        
        if (activeTemplate.groupId !== targetGroupId) {
          // Move to new group at the end
          const targetGroupTemplates = templates.filter((t) => t.groupId === targetGroupId);
          await moveTemplateToGroup(activeTemplateId, targetGroupId, targetGroupTemplates.length);
          await loadData();
        }
        return;
      }

      // Dropped on another template
      if (overIdStr.startsWith('template-')) {
        const overTemplateIdNum = parseInt(overIdStr.replace('template-', ''));
        const overTemplate = templates.find((t) => t.id === overTemplateIdNum);
        
        if (!overTemplate) return;

        const targetGroupId = overTemplate.groupId;
        const groupTemplates = templates
          .filter((t) => t.groupId === targetGroupId)
          .sort((a, b) => a.order - b.order);
        
        let overIndex = groupTemplates.findIndex((t) => t.id === overTemplateIdNum);
        
        // dropPositionに基づいて挿入位置を調整
        if (currentDropPosition === 'after') {
          overIndex = overIndex + 1;
        }

        if (activeTemplate.groupId === targetGroupId) {
          // Same group - reorder
          const activeIndex = groupTemplates.findIndex((t) => t.id === activeTemplateId);
          
          // 自分より後ろに移動する場合は調整
          let newIndex = overIndex;
          if (activeIndex < overIndex) {
            newIndex = overIndex - 1;
          }
          
          if (activeIndex !== newIndex) {
            const newOrder = arrayMove(groupTemplates, activeIndex, newIndex);
            await reorderTemplates(targetGroupId, newOrder.map((t) => t.id));
            await loadData();
          }
        } else {
          // Different group - move
          await moveTemplateToGroup(activeTemplateId, targetGroupId, overIndex);
          await loadData();
        }
      }
    }
  };

  // All sortable items (groups only - templates are sorted within their own SortableContext)
  const groupSortableIds = groups.map((g) => `group-${g.id}`);

  const activeTemplate = getActiveTemplate();
  const activeGroup = getActiveGroup();

  return (
    <div className="options-container">
      <header className="options-header">
        <h1>PromptTemplate</h1>
      </header>

      <button className="add-group-btn" onClick={handleAddGroup}>
        <PlusIcon />
        グループを追加
      </button>

      {groups.length === 0 ? (
        <div className="empty-state">
          <p>まだグループがありません</p>
          <p>「グループを追加」ボタンをクリックして開始しましょう</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={groupSortableIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="groups-container">
              {groups.map((group) => (
                <SortableGroup
                  key={group.id}
                  group={group}
                  templates={getTemplatesForGroup(group.id)}
                  isExpanded={expandedGroups.has(group.id) && !isDraggingGroup}
                  onToggle={() => handleToggleGroup(group.id)}
                  onEdit={handleEditTemplate}
                  onDeleteTemplate={handleDeleteTemplate}
                  onTemplateNameChange={handleTemplateNameChange}
                  onGroupNameChange={handleGroupNameChange}
                  onDeleteGroup={handleDeleteGroup}
                  onAddTemplate={handleAddTemplate}
                  isOver={overGroupId === group.id && !overTemplateId}
                  overTemplateId={overTemplateId}
                  isDraggingTemplate={isDraggingTemplate}
                  dropPosition={dropPosition}
                />
              ))}
            </div>
          </SortableContext>
          
          <DragOverlay>
            {activeTemplate && (
              <div className="template-item drag-overlay template-dragging">
                <DragHandle />
                <span className="template-name">{activeTemplate.name || '(名前なし)'}</span>
              </div>
            )}
            {activeGroup && (
              <div className="group-item drag-overlay">
                <div className="group-header">
                  <button className="expand-btn">
                    <ChevronIcon />
                  </button>
                  <span className="group-name">{activeGroup.name}</span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {isModalOpen && (
        <TemplateModal
          template={editingTemplate}
          groupId={addingToGroupId}
          onSave={handleSaveTemplate}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Options;
