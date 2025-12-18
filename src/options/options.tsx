import React, { useState, useEffect, useCallback } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCenter,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent 
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove } from '@dnd-kit/sortable';
import Icons from './assets/icons.ts';
import type { Template, Group } from '../types/index';
import * as s from '../utils/storage.ts';
import TemplateModal from './components/EntryEditor.tsx';
import GroupItem from './components/GroupPanel.tsx';
import DragHandle from './ui/DragHandle.tsx';
import DropGap from './ui/DropGap.tsx';
import './styles.css';

const Options: React.FC = () => {
  // データ管理
  const [groups, setGroups] = useState<Group[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // UI状態
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [addingToGroupId, setAddingToGroupId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);

  // テンプレートのドラッグ状態
  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);
  const [activeTemplateGapId, setActiveTemplateGapId] = useState<string | null>(null);

  // グループのドラッグ状態
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [activeGroupGapId, setActiveGroupGapId] = useState<string | null>(null);
  const [wasGroupExpandedBeforeDrag, setWasGroupExpandedBeforeDrag] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }), // 10px以上動かした場合のみドラッグ開始
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const loadData = useCallback(async (preserveExpandedState = false) => {
    const data = await s.loadStoredData();
    setGroups([...data.groups].sort((a, b) => a.order - b.order));
    setTemplates(data.templates);
    // 初期ロード時のみ全て展開、それ以外は現在の状態を保持
    if (!preserveExpandedState) {
      setExpandedGroups(new Set(data.groups.map((g) => g.id)));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  //* ドラッグ開始時
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const idStr = String(active.id);
    
    // テンプレートのドラッグ開始
    if (idStr.startsWith('template-')) {
      const templateId = parseInt(idStr.replace('template-', ''), 10);
      setActiveTemplateId(templateId);
      setActiveGroupId(null);
    }
    
    // グループのドラッグ開始
    if (idStr.startsWith('group-')) {
      const groupId = parseInt(idStr.replace('group-', ''), 10);
      setActiveGroupId(groupId);
      setActiveTemplateId(null);
      // ドラッグ前の展開状態を記憶
      const wasExpanded = expandedGroups.has(groupId);
      setWasGroupExpandedBeforeDrag(wasExpanded);
      // ドラッグ中は一時的にグループを閉じる
      setExpandedGroups(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    }
  };

  //* ドラッグオーバー時
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over, delta } = event;

    if (!over) {
      setActiveTemplateGapId(null);
      return;
    }

    const overId = String(over.id);
    const isAfter = delta.y > 0;
    const position: 'before' | 'after' = isAfter ? 'after' : 'before';

    //* グループをドラッグ中の場合
    if (String(active.id).startsWith('group-')) {
      // group-gapに直接ホバーした場合
      if (overId.startsWith('group-gap-')) {
        setActiveGroupGapId(overId);
        return;
      }
      
      setActiveGroupGapId(null); 
      return;
    }

    //* テンプレートをドラッグ中の場合
    
    // gapに直接ホバーした場合
    if (overId.startsWith('gap-')) {
      setActiveTemplateGapId(overId);
      return;
    }

    // gap以外の要素からgapを推測
    let targetGapId: string | null = null;

    if (overId.startsWith('template-')) {
      const tid = Number(overId.replace('template-', ''));
      if (overId !== String(active.id)) {
        const overTemplate = templates.find(t => t.id === tid);
        if (overTemplate) {
          const groupTemplates = templates
            .filter(t => t.groupId === overTemplate.groupId)
            .sort((a, b) => a.order - b.order);
          const index = groupTemplates.findIndex(t => t.id === tid);
          // ドラッグ方向でgapのインデックスを決定
          const gapIndex = position === 'after' ? index + 1 : index;
          targetGapId = `gap-${overTemplate.groupId}-${gapIndex}`;
        }
      }
    }
    
    setActiveTemplateGapId(targetGapId);
  };

  //* ドラッグ終了時の共通処理
  const handleDragEndMain = (event: DragEndEvent) => {
    const activeIdStr = String(event.active.id);

    if (activeIdStr.startsWith('group-')) {
      handleGroupDragEnd(event);
    } else if (activeIdStr.startsWith('template-')) {
      handleTemplateDragEnd(event);
    }
  };

  //* グループのドラッグ終了処理
  const handleGroupDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = parseInt(String(active.id).replace('group-', ''), 10);
    
    setActiveGroupId(null);
    setActiveGroupGapId(null);

    if (!over) {
      // アニメーション完了を待つ
      await new Promise(resolve => setTimeout(resolve, 200));
      // ドラッグ前に展開されていた場合のみ再展開
      if (wasGroupExpandedBeforeDrag) {
        setExpandedGroups(prev => {
          const next = new Set(prev);
          next.add(activeId);
          return next;
        });
      }
      setWasGroupExpandedBeforeDrag(false);
      return;
    }
    
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    if (!activeIdStr.startsWith('group-') || !overIdStr.startsWith('group-gap-')) {
      await new Promise(resolve => setTimeout(resolve, 200));
      if (wasGroupExpandedBeforeDrag) {
        setExpandedGroups(prev => {
          const next = new Set(prev);
          next.add(activeId);
          return next;
        });
      }
      setWasGroupExpandedBeforeDrag(false);
      return;
    }

    // gap IDからターゲットインデックスを抽出
    const targetIndex = parseInt(overIdStr.replace('group-gap-', ''), 10);
    if (isNaN(targetIndex)) {
      await new Promise(resolve => setTimeout(resolve, 200));
      if (wasGroupExpandedBeforeDrag) {
        setExpandedGroups(prev => {
          const next = new Set(prev);
          next.add(activeId);
          return next;
        });
      }
      setWasGroupExpandedBeforeDrag(false);
      return;
    }

    const activeGroupId = parseInt(activeIdStr.replace('group-', ''), 10);
    
    const oldIndex = groups.findIndex(g => g.id === activeGroupId);
    let newIndex = targetIndex; 

    if (oldIndex < 0 || oldIndex === newIndex) {
      await new Promise(resolve => setTimeout(resolve, 200));
      if (wasGroupExpandedBeforeDrag) {
        setExpandedGroups(prev => {
          const next = new Set(prev);
          next.add(activeId);
          return next;
        });
      }
      setWasGroupExpandedBeforeDrag(false);
      return;
    }
    
    // arrayMoveの挙動に合わせて挿入位置を調整
    const insertIndex = oldIndex < newIndex ? newIndex - 1 : newIndex;
    
    const newOrder = arrayMove(groups, oldIndex, insertIndex);

    setGroups(newOrder.map((g, i) => ({ ...g, order: i })));
    
    // アニメーション完了を待ってから永続化
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await s.reorderGroups(newOrder.map(g => g.id));
    await loadData(true);
    
    // データロード完了後、元々展開されていた場合のみグループを展開
    if (wasGroupExpandedBeforeDrag) {
      setExpandedGroups(prev => {
        const next = new Set(prev);
        next.add(activeId);
        return next;
      });
    }
    setWasGroupExpandedBeforeDrag(false);
  };

  //* テンプレートのドラッグ終了処理
  const handleTemplateDragEnd = async (event: DragEndEvent) => {
    const { active } = event;

    setActiveTemplateId(null);
    
    // 最終的なドロップターゲットはactiveTemplateGapIdに保持されている
    const finalGapId = activeTemplateGapId;
    setActiveTemplateGapId(null);

    if (!finalGapId || !finalGapId.startsWith('gap-')) return;

    const activeIdStr = String(active.id);
    if (!activeIdStr.startsWith('template-')) return;

    const activeTemplateId = parseInt(activeIdStr.replace('template-', ''), 10);
    const activeTemplate = templates.find((t) => t.id === activeTemplateId);
    if (!activeTemplate) return;

    // gap IDからグループIDとインデックスを抽出
    const parts = finalGapId.split('-');
    if (parts.length !== 3) return;

    const targetGroupId = parseInt(parts[1], 10);
    const targetIndex = parseInt(parts[2], 10);

    if (isNaN(targetGroupId) || isNaN(targetIndex)) return;

    const isCrossGroup = activeTemplate.groupId !== targetGroupId;

    if (isCrossGroup) {
      // グループ間での移動
      setTemplates((prev) => {
        const moved = {
          ...activeTemplate,
          groupId: targetGroupId,
          order: targetIndex,
        };

        const filtered = prev.filter(t => t.id !== activeTemplateId);

        const targetGroupTemplates = filtered
          .filter(t => t.groupId === targetGroupId)
          .sort((a, b) => a.order - b.order);

        targetGroupTemplates.splice(targetIndex, 0, moved);

        const updatedTarget = targetGroupTemplates.map((t, i) => ({
          ...t,
          order: i,
        }));

        const others = filtered.filter(t => t.groupId !== targetGroupId);

        return [...others, ...updatedTarget];
      });
      
      await s.moveTemplateToGroup(activeTemplateId, targetGroupId, targetIndex);
      await loadData(true);
    } else {
      // 同じグループ内での移動
      const groupTemplates = templates
        .filter((t) => t.groupId === targetGroupId)
        .sort((a, b) => a.order - b.order);

      const oldIndex = groupTemplates.findIndex((t) => t.id === activeTemplateId);
      
      // arrayMoveの挙動に合わせて挿入位置を調整
      let newIndex = targetIndex;
      if (oldIndex < targetIndex) {
        newIndex = targetIndex - 1;
      }

      if (oldIndex !== newIndex) {
        const newOrder = arrayMove(groupTemplates, oldIndex, newIndex);
        
        setTemplates((prev) => {
          const others = prev.filter(t => t.groupId !== targetGroupId);
          return [
            ...others,
            ...newOrder.map((t, i) => ({ ...t, order: i })),
          ];
        });
        
        await s.reorderTemplates(
          targetGroupId,
          newOrder.map((t) => t.id)
        );
        await loadData(true);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveTemplateId(null);
    setActiveTemplateGapId(null);
    setActiveGroupId(null);
    setActiveGroupGapId(null);
  };

  const activeTemplate = activeTemplateId
    ? templates.find((t) => t.id === activeTemplateId)
    : null;
  
  const activeGroup = activeGroupId
    ? groups.find((g) => g.id === activeGroupId)
    : null;

  const handleAddGroup = async () => {
    const newGroupId = await s.addGroup({ name: '新しいグループ' });
    await loadData(true);
    setEditingGroupId(newGroupId);
  };

  const handleDeleteGroup = async (id: number) => {
    if (confirm('このグループとすべてのテンプレートを削除しますか？')) {
      await s.deleteGroup(id);
      await loadData(true);
    }
  };

  const handleGroupNameChange = async (id: number, name: string) => {
    await s.updateGroup(id, { name });
    await loadData(true);
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
      await s.deleteTemplate(id);
      await loadData(true);
    }
  };

  const handleTemplateNameChange = async (id: number, name: string) => {
    await s.updateTemplate(id, { name });
    await loadData(true);
  };

  const handleSaveTemplate = async (
    templateData: Partial<Template> & { groupId: number }
  ) => {
    if (templateData.id) {
      await s.updateTemplate(templateData.id, {
        name: templateData.name,
        content: templateData.content,
      });
    } else {
      await s.addTemplate({
        groupId: templateData.groupId,
        name: templateData.name || '',
        content: templateData.content || '',
      });
    }
    setIsModalOpen(false);
    setEditingTemplate(null);
    setAddingToGroupId(null);
    await loadData(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setAddingToGroupId(null);
  };

  const getTemplatesForGroup = (groupId: number) =>
    templates.filter((t) => t.groupId === groupId);

  return (
    // ドラッグ&ドロップのコンテキスト
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEndMain}
      onDragCancel={handleDragCancel}
    >
      <div className="options-container">
        {/* ヘッダー */}
        <header className="options-header">
          <h1>PromptTemplate</h1>
        </header>

        {/* グループエリア */}
        <div className="group-area-container">
          <div className="group-actions-header">
            <button className="add-group-btn" onClick={handleAddGroup}>
              <Icons.PlaylistAdd />
              グループを追加
            </button>
          </div>

          {/* グループが存在しない場合の空状態表示 */}
          {groups.length === 0 ? (
            <div className="empty-state">
              <p>まだグループがありません</p>
              <p>「追加」ボタンをクリックして開始しましょう</p>
            </div>
          ) : (
            // グループ一覧
            <div className="groups-container">
              {groups.map((group, idx) => (
                <React.Fragment key={group.id}>
                  <DropGap
                    type="group"
                    indexOrId={idx}
                    isActive={activeGroupGapId === `group-gap-${idx}`}
                    isDraggingGroup={activeGroupId !== null}
                  />
                  
                  <GroupItem
                    group={group}
                    templates={getTemplatesForGroup(group.id)}
                    isExpanded={expandedGroups.has(group.id)}
                    onToggle={() => handleToggleGroup(group.id)}
                    onEdit={handleEditTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    onTemplateNameChange={handleTemplateNameChange}
                    onGroupNameChange={handleGroupNameChange}
                    onDeleteGroup={handleDeleteGroup}
                    onAddTemplate={handleAddTemplate}
                    startEditing={editingGroupId === group.id}
                    onEditingComplete={() => setEditingGroupId(null)}
                    activeTemplateId={activeTemplateId}
                    activeGapId={activeTemplateGapId}
                    groupDraggableId={`group-${group.id}`}
                    isGroupDragging={activeGroupId === group.id}
                  />
                </React.Fragment>
              ))}
              <DropGap
                type="group"
                indexOrId={groups.length}
                isActive={activeGroupGapId === `group-gap-${groups.length}`}
                isDraggingGroup={activeGroupId !== null}
              />
            </div>
          )}
        </div>

        {/* テンプレート編集モーダル */}
        {isModalOpen && (
          <TemplateModal
            template={editingTemplate}
            groupId={addingToGroupId}
            onSave={handleSaveTemplate}
            onClose={handleCloseModal}
          />
        )}

        {/* ドラッグ中のオーバーレイ表示 */}
        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
          {/* テンプレートのドラッグ表示 */}
          {activeTemplate && (
            <div className="template-item drag-overlay">
              <DragHandle />
              <span className="template-name">{activeTemplate.name}</span>
              <div className="template-actions">
                <button className="icon-btn">
                  <Icons.Edit />
                </button>
                <button className="icon-btn delete">
                  <Icons.Delete />
                </button>
              </div>
            </div>
          )}

          {/* グループのドラッグ表示 */}
          {activeGroup && (
            <div className="group-item dragging-overlay">
              <div className="group-header">
                <button className="expand-btn">
                  <Icons.ExpandMore />
                </button>
                <span className="group-name">{activeGroup.name}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default Options;