import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Template, Group } from '../../types/index';
import * as s from '../../utils/storage';

export const useGroupsAndTemplates = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // 初期データ読み込み
  const loadData = useCallback(async () => {
    try {
      const data = await s.loadStoredData();
      setGroups([...data.groups].sort((a, b) => a.order - b.order));
      setTemplates(data.templates);
    } catch (error) {
      handleStorageError(error, 'データの読み込み');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // エラーハンドリング（storage側で既にログ出力済み）
  const handleStorageError = (error: unknown, operation: string) => {
    if (error instanceof Error && error.name === 'StorageError') {
      const cause = (error as any).cause;
      if (cause?.name === 'QuotaExceededError') {
        alert('ストレージ容量が不足しています。不要なデータを削除してください。');
        return;
      }
    }
    alert(`${operation}中にエラーが発生しました。再度お試しください。`);
  };

  // グループ操作
  const addGroup = async () => {
    const tempId = -Date.now();
    const newGroup: Group = {
      id: tempId,
      name: '新しいグループ',
      order: groups.length,
    };

    // 楽観的更新
    setGroups((prev) => [...prev, newGroup]);

    try {
      const actualId = await s.addGroup({ name: '新しいグループ' });
      // 実際のIDに置き換え
      setGroups((prev) => prev.map((g) => (g.id === tempId ? { ...g, id: actualId } : g)));
      return actualId;
    } catch (error) {
      // ロールバック
      setGroups((prev) => prev.filter((g) => g.id !== tempId));
      handleStorageError(error, 'グループの追加');
      throw error;
    }
  };

  const deleteGroup = async (id: number) => {
    if (!confirm('このグループとすべてのテンプレートを削除しますか？')) {
      return;
    }

    // 楽観的削除
    const prevGroups = groups;
    const prevTemplates = templates;
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setTemplates((prev) => prev.filter((t) => t.groupId !== id));

    try {
      await s.deleteGroup(id);
    } catch (error) {
      // ロールバック
      setGroups(prevGroups);
      setTemplates(prevTemplates);
      handleStorageError(error, 'グループの削除');
    }
  };

  const updateGroupName = async (id: number, name: string) => {
    // 楽観的更新
    const prevGroups = groups;
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));

    try {
      await s.updateGroup(id, { name });
    } catch (error) {
      setGroups(prevGroups);
      handleStorageError(error, 'グループ名の更新');
    }
  };

  const reorderGroups = async (groupIds: number[]) => {
    // 楽観的更新
    const prevGroups = groups;
    const reordered = groupIds.map((id, index) => {
      const group = groups.find((g) => g.id === id)!;
      return { ...group, order: index };
    });
    setGroups(reordered);

    try {
      await s.reorderGroups(groupIds);
    } catch (error) {
      setGroups(prevGroups);
      handleStorageError(error, 'グループの並び替え');
    }
  };

  // テンプレート操作
  const addTemplate = async (data: { groupId: number; name: string; content: string }) => {
    const tempId = -Date.now();
    const groupTemplates = templates.filter((t) => t.groupId === data.groupId);
    const newTemplate: Template = {
      ...data,
      id: tempId,
      order: groupTemplates.length,
    };

    // 楽観的更新
    setTemplates((prev) => [...prev, newTemplate]);

    try {
      const actualId = await s.addTemplate(data);
      // 実際のIDに置き換え
      setTemplates((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: actualId } : t)));
    } catch (error) {
      // ロールバック
      setTemplates((prev) => prev.filter((t) => t.id !== tempId));
      handleStorageError(error, 'テンプレートの追加');
    }
  };

  const updateTemplate = async (id: number, data: Partial<Template>) => {
    const prevTemplates = templates;
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));

    try {
      await s.updateTemplate(id, data);
    } catch (error) {
      setTemplates(prevTemplates);
      handleStorageError(error, 'テンプレートの更新');
    }
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm('このテンプレートを削除しますか？')) {
      return;
    }

    const prevTemplates = templates;
    setTemplates((prev) => prev.filter((t) => t.id !== id));

    try {
      await s.deleteTemplate(id);
    } catch (error) {
      setTemplates(prevTemplates);
      handleStorageError(error, 'テンプレートの削除');
    }
  };

  const moveTemplateToGroup = async (templateId: number, targetGroupId: number, targetIndex: number) => {
    const prevTemplates = templates;

    // 楽観的更新は useDragAndDrop で既に実行済み
    try {
      await s.moveTemplateToGroup(templateId, targetGroupId, targetIndex);
    } catch (error) {
      setTemplates(prevTemplates);
      handleStorageError(error, 'テンプレートの移動');
    }
  };

  const reorderTemplates = async (groupId: number, templateIds: number[]) => {
    const prevTemplates = templates;

    // 楽観的更新は useDragAndDrop で既に実行済み
    try {
      await s.reorderTemplates(groupId, templateIds);
    } catch (error) {
      setTemplates(prevTemplates);
      handleStorageError(error, 'テンプレートの並び替え');
    }
  };

  // グループ別テンプレート取得
  const templatesByGroup = useMemo(() => {
    const map = new Map<number, Template[]>();
    templates.forEach((t) => {
      if (t.groupId !== null && !map.has(t.groupId)) {
        map.set(t.groupId, []);
      }
      if (t.groupId !== null) {
        map.get(t.groupId)!.push(t);
      }
    });
    // 各グループ内でソート
    map.forEach((temps) => {
      temps.sort((a, b) => a.order - b.order);
    });
    return map;
  }, [templates]);

  const getTemplatesForGroup = useCallback(
    (groupId: number) => templatesByGroup.get(groupId) || [],
    [templatesByGroup],
  );

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
