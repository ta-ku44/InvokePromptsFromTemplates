import { useState } from 'react';
import { useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Template, Group } from '../../types/index';

interface UseDragAndDropProps {
  groups: Group[];
  templates: Template[];
  expandedGroups: Set<number>;
  setExpandedGroups: React.Dispatch<React.SetStateAction<Set<number>>>;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  reorderGroups: (groupIds: number[]) => Promise<void>;
  moveTemplateToGroup: (
    templateId: number,
    targetGroupId: number,
    targetIndex: number,
  ) => Promise<void>;
  reorderTemplates: (groupId: number, templateIds: number[]) => Promise<void>;
}

export const useDragAndDrop = ({
  groups,
  templates,
  expandedGroups,
  setExpandedGroups,
  setGroups,
  setTemplates,
  reorderGroups,
  moveTemplateToGroup,
  reorderTemplates,
}: UseDragAndDropProps) => {
  // テンプレートのドラッグ状態
  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);
  const [activeTemplateGapId, setActiveTemplateGapId] = useState<string | null>(null);

  // グループのドラッグ状態
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [activeGroupGapId, setActiveGroupGapId] = useState<string | null>(null);
  const [wasGroupExpandedBeforeDrag, setWasGroupExpandedBeforeDrag] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const idStr = String(active.id);

    if (idStr.startsWith('template-')) {
      const templateId = parseInt(idStr.replace('template-', ''), 10);
      setActiveTemplateId(templateId);
      setActiveGroupId(null);
    }

    if (idStr.startsWith('group-')) {
      const groupId = parseInt(idStr.replace('group-', ''), 10);
      setActiveGroupId(groupId);
      setActiveTemplateId(null);

      // グループ展開状態を保存し、ドラッグ中は折りたたむ
      const wasExpanded = expandedGroups.has(groupId);
      setWasGroupExpandedBeforeDrag(wasExpanded);
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over, activatorEvent } = event;

    if (!over) {
      setActiveTemplateGapId(null);
      setActiveGroupGapId(null);
      return;
    }

    const activeIdStr = String(active.id);
    const overId = String(over.id);

    // グループドラッグ時の処理
    if (activeIdStr.startsWith('group-')) {
      if (overId.startsWith('group-gap-')) {
        setActiveGroupGapId(overId);
      } else {
        setActiveGroupGapId(null);
      }
      return;
    }

    // テンプレートドラッグ時の処理
    if (activeIdStr.startsWith('template-')) {
      // ギャップに直接ホバーした場合
      if (overId.startsWith('gap-')) {
        setActiveTemplateGapId(overId);
        return;
      }

      // テンプレート要素にホバーした場合：要素の中心を基準に前後を判定
      if (overId.startsWith('template-')) {
        const tid = Number(overId.replace('template-', ''));

        // 自分自身の上にホバーしている場合は何もしない
        if (overId === activeIdStr) {
          setActiveTemplateGapId(null);
          return;
        }

        const overTemplate = templates.find((t) => t.id === tid);

        // groupId が null のテンプレートは移動不可
        if (
          overTemplate &&
          overTemplate.groupId !== null &&
          activatorEvent &&
          'clientY' in activatorEvent
        ) {
          // DOM要素から位置情報を取得
          const overElement = document.querySelector(`[data-template-id="${tid}"]`);

          if (overElement) {
            const rect = overElement.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const pointerY = (activatorEvent as MouseEvent).clientY;

            // ポインターが要素の中心より下なら'after'、上なら'before'
            const position = pointerY > centerY ? 'after' : 'before';

            // 同じグループ内のテンプレート一覧を取得
            const groupTemplates = templates
              .filter((t) => t.groupId === overTemplate.groupId)
              .sort((a, b) => a.order - b.order);

            const index = groupTemplates.findIndex((t) => t.id === tid);

            // before なら要素の前のギャップ、after なら要素の後のギャップ
            const gapIndex = position === 'after' ? index + 1 : index;
            setActiveTemplateGapId(`gap-${overTemplate.groupId}-${gapIndex}`);
          }
        }
        return;
      }

      // その他の場合はギャップをクリア
      setActiveTemplateGapId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const activeIdStr = String(event.active.id);

    if (activeIdStr.startsWith('group-')) {
      await handleGroupDragEnd(event);
    } else if (activeIdStr.startsWith('template-')) {
      await handleTemplateDragEnd(event);
    }
  };

  const handleGroupDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = parseInt(String(active.id).replace('group-', ''), 10);

    setActiveGroupId(null);
    setActiveGroupGapId(null);

    // ドロップ先がない場合：元の展開状態を復元
    if (!over) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (wasGroupExpandedBeforeDrag) {
        setExpandedGroups((prev) => {
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

    // グループギャップ以外にドロップした場合：元の展開状態を復元
    if (!activeIdStr.startsWith('group-') || !overIdStr.startsWith('group-gap-')) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (wasGroupExpandedBeforeDrag) {
        setExpandedGroups((prev) => {
          const next = new Set(prev);
          next.add(activeId);
          return next;
        });
      }
      setWasGroupExpandedBeforeDrag(false);
      return;
    }

    // targetIndexは「group-gap-N」のN（ギャップ番号）
    const targetIndex = parseInt(overIdStr.replace('group-gap-', ''), 10);

    if (isNaN(targetIndex)) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (wasGroupExpandedBeforeDrag) {
        setExpandedGroups((prev) => {
          const next = new Set(prev);
          next.add(activeId);
          return next;
        });
      }
      setWasGroupExpandedBeforeDrag(false);
      return;
    }

    const activeGroupId = parseInt(activeIdStr.replace('group-', ''), 10);
    const oldIndex = groups.findIndex((g) => g.id === activeGroupId);

    // 移動がない場合：元の展開状態を復元
    if (oldIndex < 0 || oldIndex === targetIndex) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (wasGroupExpandedBeforeDrag) {
        setExpandedGroups((prev) => {
          const next = new Set(prev);
          next.add(activeId);
          return next;
        });
      }
      setWasGroupExpandedBeforeDrag(false);
      return;
    }

    // グループはドラッグ中に元の位置が詰められるため、後方へ移動する場合は削除前インデックス基準の
    // arrayMove に合わせて targetIndex を 1 減らして補正する必要がある。
    const insertIndex = oldIndex < targetIndex ? targetIndex - 1 : targetIndex;
    const newOrder = arrayMove(groups, oldIndex, insertIndex);

    setGroups(newOrder.map((g, i) => ({ ...g, order: i })));

    await new Promise((resolve) => setTimeout(resolve, 200));

    await reorderGroups(newOrder.map((g) => g.id));

    // 元の展開状態を復元
    if (wasGroupExpandedBeforeDrag) {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        next.add(activeId);
        return next;
      });
    }
    setWasGroupExpandedBeforeDrag(false);
  };

  const handleTemplateDragEnd = async (event: DragEndEvent) => {
    const { active } = event;

    setActiveTemplateId(null);

    const finalGapId = activeTemplateGapId;
    setActiveTemplateGapId(null);

    if (!finalGapId || !finalGapId.startsWith('gap-')) return;

    const activeIdStr = String(active.id);
    if (!activeIdStr.startsWith('template-')) return;

    const activeTemplateId = parseInt(activeIdStr.replace('template-', ''), 10);
    const activeTemplate = templates.find((t) => t.id === activeTemplateId);
    if (!activeTemplate) return;

    // groupId が null のテンプレートは移動不可
    if (activeTemplate.groupId === null) return;

    // finalGapIdは「gap-{groupId}-{index}」形式
    const parts = finalGapId.split('-');
    if (parts.length !== 3) return;

    const targetGroupId = parseInt(parts[1], 10);
    const targetIndex = parseInt(parts[2], 10);

    if (isNaN(targetGroupId) || isNaN(targetIndex)) return;

    const isCrossGroup = activeTemplate.groupId !== targetGroupId;

    // 別グループへの移動
    if (isCrossGroup) {
      setTemplates((prev) => {
        const moved = {
          ...activeTemplate,
          groupId: targetGroupId,
          order: targetIndex,
        };

        const filtered = prev.filter((t) => t.id !== activeTemplateId);
        const targetGroupTemplates = filtered
          .filter((t) => t.groupId === targetGroupId)
          .sort((a, b) => a.order - b.order);

        targetGroupTemplates.splice(targetIndex, 0, moved);

        const updatedTarget = targetGroupTemplates.map((t, i) => ({
          ...t,
          order: i,
        }));

        const others = filtered.filter((t) => t.groupId !== targetGroupId);
        return [...others, ...updatedTarget];
      });

      await moveTemplateToGroup(activeTemplateId, targetGroupId, targetIndex);
    } else {
      // 同じグループ内での並び替え
      const groupTemplates = templates
        .filter((t) => t.groupId === targetGroupId)
        .sort((a, b) => a.order - b.order);

      const oldIndex = groupTemplates.findIndex((t) => t.id === activeTemplateId);

      // ドラッグ中は要素が元の位置に残るため、後方へ移動する場合は「ドラッグ中の配列基準」の targetIndex を
      // 1 減らして補正し、その値を newIndex として並び替える必要がある。
      const newIndex = oldIndex < targetIndex ? targetIndex - 1 : targetIndex;

      if (oldIndex !== newIndex) {
        const newOrder = arrayMove(groupTemplates, oldIndex, newIndex);

        setTemplates((prev) => {
          const others = prev.filter((t) => t.groupId !== targetGroupId);
          return [...others, ...newOrder.map((t, i) => ({ ...t, order: i }))];
        });

        await reorderTemplates(
          targetGroupId,
          newOrder.map((t) => t.id),
        );
      }
    }
  };

  const handleDragCancel = () => {
    setActiveTemplateId(null);
    setActiveTemplateGapId(null);
    setActiveGroupId(null);
    setActiveGroupGapId(null);
  };

  const activeTemplate = activeTemplateId ? templates.find((t) => t.id === activeTemplateId) : null;

  const activeGroup = activeGroupId ? groups.find((g) => g.id === activeGroupId) : null;

  return {
    sensors,
    activeTemplateId,
    activeTemplateGapId,
    activeGroupId,
    activeGroupGapId,
    activeTemplate,
    activeGroup,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
};
