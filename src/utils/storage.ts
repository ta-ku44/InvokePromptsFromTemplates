import browser from 'webextension-polyfill';
import type { Template, Group, StorageData } from '../types/index';

const DEFAULT_DATA: StorageData = {
  templates: [],
  groups: [],
  shortcutKey: '#',
};

//* ストレージエラー処理
class StorageError extends Error {
  public readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StorageError';
    this.cause = cause;
  }
}

//* 基本操作
export const loadStoredData = async (): Promise<StorageData> => {
  try {
    const result = await browser.storage.sync.get('data');
    const data = result.data as Partial<StorageData> | undefined;
    return { ...DEFAULT_DATA, ...data };
  } catch (error) {
    throw new StorageError('データの読み込みに失敗しました', error);
  }
};

const saveStoredData = async (data: StorageData): Promise<void> => {
  try {
    await browser.storage.sync.set({ data });
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new StorageError('ストレージの容量が超過しました', error);
    }
    throw new StorageError('データの保存に失敗しました', error);
  }
};

const updateStoredData = async (updater: (data: StorageData) => StorageData): Promise<void> => {
  const data = await loadStoredData();
  const updated = updater(data);
  await saveStoredData(updated);
};

//* ユーティリティ
const getNextId = <T extends { id: number }>(items: T[]): number =>
  items.reduce((max, item) => Math.max(max, item.id), 0) + 1;

const getNextOrder = <T extends { order: number }>(items: T[]): number =>
  items.reduce((max, item) => Math.max(max, item.order), 0) + 1;

const reorderItems = <T extends { id: number; order: number }>(items: T[], orderedIds: number[]): T[] =>
  items.map((item) => {
    const newOrder = orderedIds.indexOf(item.id);
    return newOrder !== -1 ? { ...item, order: newOrder } : item;
  });

//* Template操作
export const saveTemplates = async (templates: Template[]): Promise<void> => {
  await updateStoredData((data) => ({ ...data, templates }));
};

export const addTemplate = async (template: Omit<Template, 'id' | 'order'>): Promise<number> => {
  let newId = 0;
  await updateStoredData((data) => {
    const groupTemplates = data.templates.filter((t) => t.groupId === template.groupId);
    newId = getNextId(data.templates);
    const newTemplate: Template = {
      ...template,
      id: newId,
      order: getNextOrder(groupTemplates),
    };
    return { ...data, templates: [...data.templates, newTemplate] };
  });
  return newId;
};

export const updateTemplate = async (id: number, updates: Partial<Template>): Promise<void> => {
  await updateStoredData((data) => ({
    ...data,
    templates: data.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
  }));
};

export const deleteTemplate = async (id: number): Promise<void> => {
  await updateStoredData((data) => ({
    ...data,
    templates: data.templates.filter((t) => t.id !== id),
  }));
};

export const deleteAllTemplates = async (): Promise<void> => {
  await updateStoredData((data) => ({ ...data, templates: [] }));
};

export const reorderTemplates = async (groupId: number, orderedIds: number[]): Promise<void> => {
  await updateStoredData((data) => ({
    ...data,
    templates: data.templates.map((t) => {
      if (t.groupId !== groupId) return t;
      const newOrder = orderedIds.indexOf(t.id);
      return newOrder !== -1 ? { ...t, order: newOrder } : t;
    }),
  }));
};

//* テンプレート移動時のorder調整
const adjustOrderOnMove = (
  template: Template,
  targetId: number,
  oldGroupId: number,
  oldOrder: number,
  newGroupId: number,
  newOrder: number,
): Template => {
  if (template.id === targetId) {
    return { ...template, groupId: newGroupId, order: newOrder };
  }

  // 同じグループ内での移動
  if (oldGroupId === newGroupId && template.groupId === newGroupId) {
    if (oldOrder < newOrder && template.order > oldOrder && template.order <= newOrder) {
      return { ...template, order: template.order - 1 };
    }
    if (oldOrder > newOrder && template.order >= newOrder && template.order < oldOrder) {
      return { ...template, order: template.order + 1 };
    }
  }

  // 異なるグループ間での移動
  if (oldGroupId !== newGroupId) {
    if (template.groupId === oldGroupId && template.order > oldOrder) {
      return { ...template, order: template.order - 1 };
    }
    if (template.groupId === newGroupId && template.order >= newOrder) {
      return { ...template, order: template.order + 1 };
    }
  }

  return template;
};

export const moveTemplateToGroup = async (templateId: number, newGroupId: number, newOrder: number): Promise<void> => {
  await updateStoredData((data) => {
    const targetTemplate = data.templates.find((t) => t.id === templateId);
    if (!targetTemplate) return data;

    const { groupId: oldGroupId, order: oldOrder } = targetTemplate;
    if (oldGroupId === null || oldOrder === null) return data;
    const templates = data.templates.map((t) =>
      adjustOrderOnMove(t, templateId, oldGroupId, oldOrder, newGroupId, newOrder),
    );

    return { ...data, templates };
  });
};

//* Group操作
export const saveGroups = async (groups: Group[]): Promise<void> => {
  await updateStoredData((data) => ({ ...data, groups }));
};

export const addGroup = async (group: Omit<Group, 'id' | 'order'>): Promise<number> => {
  const data = await loadStoredData();
  const newGroup: Group = {
    ...group,
    id: getNextId(data.groups),
    order: getNextOrder(data.groups),
  };
  await saveGroups([...data.groups, newGroup]);
  return newGroup.id;
};

export const updateGroup = async (id: number, updates: Partial<Group>): Promise<void> => {
  await updateStoredData((data) => ({
    ...data,
    groups: data.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
  }));
};

export const deleteGroup = async (id: number): Promise<void> => {
  await updateStoredData((data) => ({
    ...data,
    groups: data.groups.filter((g) => g.id !== id),
    templates: data.templates.filter((t) => t.groupId !== id),
  }));
};

export const reorderGroups = async (orderedIds: number[]): Promise<void> => {
  await updateStoredData((data) => ({
    ...data,
    groups: reorderItems(data.groups, orderedIds),
  }));
};

export const getTemplatesByGroup = async (groupId: number): Promise<Template[]> => {
  const data = await loadStoredData();
  return data.templates.filter((t) => t.groupId === groupId).sort((a, b) => a.order - b.order);
};

//* ショートカットキー操作
export const saveShortcutKey = async (shortcutKey: string): Promise<void> => {
  await updateStoredData((data) => ({ ...data, shortcutKey }));
};

export const loadShortcutKey = async (): Promise<string> => {
  const data = await loadStoredData();
  return data.shortcutKey;
};

export const resetStorage = async (): Promise<void> => {
  await saveStoredData(DEFAULT_DATA);
};
