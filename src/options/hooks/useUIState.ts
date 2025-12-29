import { useEffect, useRef, useState } from 'react';
import type { Template } from '../../types';

export const useUIState = (groupIds: number[]) => {
  const initializedRef = useRef(false);
  const prevGroupIdsRef = useRef<number[]>([]);

  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(() => new Set());
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [addingToGroupId, setAddingToGroupId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);

  useEffect(() => {
    // 初回: すべてのグループを展開
    if (!initializedRef.current && groupIds.length > 0) {
      setExpandedGroups(new Set(groupIds));
      prevGroupIdsRef.current = groupIds;
      initializedRef.current = true;
      return;
    }

    // 2回目以降: 新規追加されたグループのみ展開
    if (initializedRef.current) {
      const prevIds = new Set(prevGroupIdsRef.current);
      const newGroupIds = groupIds.filter(id => !prevIds.has(id));
      
      if (newGroupIds.length > 0) {
        setExpandedGroups(prev => {
          const next = new Set(prev);
          newGroupIds.forEach(id => next.add(id));
          return next;
        });
      }

      // 削除されたグループは展開状態から除外
      const currentIds = new Set(groupIds);
      setExpandedGroups(prev => {
        const next = new Set(prev);
        let changed = false;
        prev.forEach(id => {
          if (!currentIds.has(id)) {
            next.delete(id);
            changed = true;
          }
        });
        return changed ? next : prev;
      });

      prevGroupIdsRef.current = groupIds;
    }
  }, [groupIds]);

  const toggleGroup = (groupId: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  const openAddTemplateModal = (groupId: number) => {
    setAddingToGroupId(groupId);
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const openEditTemplateModal = (template: Template) => {
    setEditingTemplate(template);
    setAddingToGroupId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setAddingToGroupId(null);
  };

  const startEditingGroup = (groupId: number) => {
    setEditingGroupId(groupId);
  };

  const finishEditingGroup = () => {
    setEditingGroupId(null);
  };

  return {
    expandedGroups,
    setExpandedGroups,
    editingTemplate,
    addingToGroupId,
    isModalOpen,
    editingGroupId,
    toggleGroup,
    openAddTemplateModal,
    openEditTemplateModal,
    closeModal,
    startEditingGroup,
    finishEditingGroup,
  };
};