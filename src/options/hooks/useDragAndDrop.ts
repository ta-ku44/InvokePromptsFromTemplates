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
  moveTemplateToGroup: (templateId: number, targetGroupId: number, targetIndex: number) => Promise<void>;
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
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const idStr = String(active.id);
    
    console.log('Drag Start:', { activeId: idStr });

    if (idStr.startsWith('template-')) {
      const templateId = parseInt(idStr.replace('template-', ''), 10);
      setActiveTemplateId(templateId);
      setActiveGroupId(null);
    }
    
    if (idStr.startsWith('group-')) {
      const groupId = parseInt(idStr.replace('group-', ''), 10);
      setActiveGroupId(groupId);
      setActiveTemplateId(null);
      const wasExpanded = expandedGroups.has(groupId);
      setWasGroupExpandedBeforeDrag(wasExpanded);
      setExpandedGroups(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over, delta, activatorEvent } = event;

    console.log('Drag Over:', {
      activeId: String(active.id),
      overId: over ? String(over.id) : null,
      delta,
      pointer: {
        x: (activatorEvent as MouseEvent).clientX,
        y: (activatorEvent as MouseEvent).clientY,
      }
    });

    if (!over) {
      setActiveTemplateGapId(null);
      return;
    }

    const overId = String(over.id);
    const isAfter = delta.y > 0;
    const position: 'before' | 'after' = isAfter ? 'after' : 'before';

    if (String(active.id).startsWith('group-')) {
      if (overId.startsWith('group-gap-')) {
        setActiveGroupGapId(overId);
        return;
      }
      setActiveGroupGapId(null); 
      return;
    }

    if (overId.startsWith('gap-')) {
      setActiveTemplateGapId(overId);
      return;
    }

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
          const gapIndex = position === 'after' ? index + 1 : index;
          targetGapId = `gap-${overTemplate.groupId}-${gapIndex}`;
        }
      }
    }
    
    setActiveTemplateGapId(targetGapId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('Drag End:', {
      activeId: String(active.id),
      overId: over ? String(over.id) : null,
    });

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

    if (!over) {
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

    const targetIndex = parseInt(overIdStr.replace('group-gap-', ''), 10);
    console.log('Group Drag End:', {
      activeId: activeIdStr,
      overId: overIdStr,
      targetIndex,
    });

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
    
    if (oldIndex < 0 || oldIndex === targetIndex) {
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
    
    const insertIndex = oldIndex < targetIndex ? targetIndex - 1 : targetIndex;
    const newOrder = arrayMove(groups, oldIndex, insertIndex);

    setGroups(newOrder.map((g, i) => ({ ...g, order: i })));
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await reorderGroups(newOrder.map(g => g.id));
    
    if (wasGroupExpandedBeforeDrag) {
      setExpandedGroups(prev => {
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

    const parts = finalGapId.split('-');
    if (parts.length !== 3) return;

    const targetGroupId = parseInt(parts[1], 10);
    const targetIndex = parseInt(parts[2], 10);

    if (isNaN(targetGroupId) || isNaN(targetIndex)) return;

    const isCrossGroup = activeTemplate.groupId !== targetGroupId;

    if (isCrossGroup) {
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
      
      await moveTemplateToGroup(activeTemplateId, targetGroupId, targetIndex);
    } else {
      const groupTemplates = templates
        .filter((t) => t.groupId === targetGroupId)
        .sort((a, b) => a.order - b.order);

      const oldIndex = groupTemplates.findIndex((t) => t.id === activeTemplateId);
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
        
        await reorderTemplates(targetGroupId, newOrder.map((t) => t.id));
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