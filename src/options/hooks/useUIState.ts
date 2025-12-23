import { useEffect, useRef, useState } from 'react';
import type { Template } from '../../types';

export const useUIState = (initialGroupIds: number[]) => {
  const initializedRef = useRef(false);

  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(() => new Set());
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [addingToGroupId, setAddingToGroupId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);

  useEffect(() => {
    if (initializedRef.current) return;
    if (initialGroupIds.length === 0) return;

    setExpandedGroups(new Set(initialGroupIds));
    initializedRef.current = true;
  }, [initialGroupIds]);

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
