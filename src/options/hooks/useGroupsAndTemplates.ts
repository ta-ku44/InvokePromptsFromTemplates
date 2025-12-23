import { useState, useEffect, useCallback } from 'react';
import type { Template, Group } from '../../types/index';
import * as s from '../../utils/storage';

export const useGroupsAndTemplates = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const loadData = useCallback(async (preserveExpandedState = false) => {
    const data = await s.loadStoredData();
    setGroups([...data.groups].sort((a, b) => a.order - b.order));
    setTemplates(data.templates);
    return preserveExpandedState;
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // グループ操作
  const addGroup = async () => {
    const newGroupId = await s.addGroup({ name: '新しいグループ' });
    await loadData(true);
    return newGroupId;
  };

  const deleteGroup = async (id: number) => {
    if (confirm('このグループとすべてのテンプレートを削除しますか？')) {
      await s.deleteGroup(id);
      await loadData(true);
    }
  };

  const updateGroupName = async (id: number, name: string) => {
    await s.updateGroup(id, { name });
    await loadData(true);
  };

  const reorderGroups = async (groupIds: number[]) => {
    await s.reorderGroups(groupIds);
    await loadData(true);
  };

  // テンプレート操作
  const addTemplate = async (data: { groupId: number; name: string; content: string }) => {
    await s.addTemplate(data);
    await loadData(true);
  };

  const updateTemplate = async (id: number, data: Partial<Template>) => {
    await s.updateTemplate(id, data);
    await loadData(true);
  };

  const deleteTemplate = async (id: number) => {
    if (confirm('このテンプレートを削除しますか？')) {
      await s.deleteTemplate(id);
      await loadData(true);
    }
  };

  const moveTemplateToGroup = async (templateId: number, targetGroupId: number, targetIndex: number) => {
    await s.moveTemplateToGroup(templateId, targetGroupId, targetIndex);
    await loadData(true);
  };

  const reorderTemplates = async (groupId: number, templateIds: number[]) => {
    await s.reorderTemplates(groupId, templateIds);
    await loadData(true);
  };

  const getTemplatesForGroup = (groupId: number) =>
    templates.filter((t) => t.groupId === groupId);

  return {
    groups,
    templates,
    setGroups,
    setTemplates,
    loadData,
    addGroup,
    deleteGroup,
    updateGroupName,
    reorderGroups,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    moveTemplateToGroup,
    reorderTemplates,
    getTemplatesForGroup,
  };
};