import browser from 'webextension-polyfill';
import type { Template, Group, StorageData } from '../types/index';

const DEFAULT_DATA: StorageData = {
  templates: [],
  groups: [],
  shortcutKey: '#',
};

//* Template関連のストレージ操作 */
export const loadStoredData = async (): Promise<StorageData> => {
  const result = await browser.storage.sync.get('data');
  const data = result.data as Partial<StorageData> | undefined;
  return { ...DEFAULT_DATA, ...data };
};

export const saveTemplates = async (templates: Template[]): Promise<void> => {
  const data = await loadStoredData();
  await browser.storage.sync.set({ data: { ...data, templates } });
};

export const addTemplate = async (template: Omit<Template, 'id' | 'order'>): Promise<void> => {
  const data = await loadStoredData();
  const maxId = data.templates.reduce((max, t) => Math.max(max, t.id), 0);
  const maxOrder = data.templates
    .filter(t => t.groupId === template.groupId)
    .reduce((max, t) => Math.max(max, t.order), 0);
  const newTemplate: Template = {
    ...template,
    id: maxId + 1,
    order: maxOrder + 1,
  };
  await saveTemplates([...data.templates, newTemplate]);
};

export const updateTemplate = async (id: number, updates: Partial<Template>): Promise<void> => {
  const data = await loadStoredData();
  const templates = data.templates.map(t => 
    t.id === id ? { ...t, ...updates } : t
  );
  await saveTemplates(templates);
};

export const deleteTemplate = async (id: number): Promise<void> => {
  const data = await loadStoredData();
  const templates = data.templates.filter(t => t.id !== id);
  await saveTemplates(templates);
};

export const deleteAllTemplates = async (): Promise<void> => {
  await saveTemplates([]);
}

export const reorderTemplates = async (groupId: number, orderedIds: number[]): Promise<void> => {
  const data = await loadStoredData();
  const templates = data.templates.map(t => {
    if (t.groupId === groupId) {
      const newOrder = orderedIds.indexOf(t.id);
      return { ...t, order: newOrder !== -1 ? newOrder : t.order };
    }
    return t;
  });
  await saveTemplates(templates);
};

//* Group関連のストレージ操作 */
export const saveGroups = async (groups: Group[]): Promise<void> => {
  const data = await loadStoredData();
  await browser.storage.sync.set({ data: { ...data, groups } });
}

export const addGroup = async (group: Omit<Group, 'id' | 'order'>): Promise<void> => {
  const data = await loadStoredData();
  const maxId = data.groups.reduce((max, g) => Math.max(max, g.id), 0);
  const maxOrder = data.groups.reduce((max, g) => Math.max(max, g.order), 0);
  const newGroup: Group = {
    ...group,
    id: maxId + 1,
    order: maxOrder + 1,
  };
  await saveGroups([...data.groups, newGroup]);
};

export const updateGroup = async (id: number, updates: Partial<Group>): Promise<void> => {
  const data = await loadStoredData();
  const groups = data.groups.map(g => 
    g.id === id ? { ...g, ...updates } : g
  );
  await saveGroups(groups);
};

export const deleteGroup = async (id: number): Promise<void> => {
  const data = await loadStoredData();
  const groups = data.groups.filter(g => g.id !== id);
  // グループに属するテンプレートも削除
  const templates = data.templates.filter(t => t.groupId !== id);
  await browser.storage.sync.set({ data: { ...data, groups, templates } });
};

export const reorderGroups = async (orderedIds: number[]): Promise<void> => {
  const data = await loadStoredData();
  const groups = data.groups.map(g => {
    const newOrder = orderedIds.indexOf(g.id);
    return { ...g, order: newOrder !== -1 ? newOrder : g.order };
  });
  await saveGroups(groups);
};

export const getTemplatesByGroup = async (groupId: number): Promise<Template[]> => {
  const data = await loadStoredData();
  return data.templates
    .filter(t => t.groupId === groupId)
    .sort((a, b) => a.order - b.order);
};

export const moveTemplateToGroup = async (
  templateId: number,
  newGroupId: number,
  newOrder: number
): Promise<void> => {
  const data = await loadStoredData();
  const templates = data.templates.map(t => {
    if (t.id === templateId) {
      return { ...t, groupId: newGroupId, order: newOrder };
    }
    // 新しいグループ内で、挿入位置以降のテンプレートのorderを1つずつ増やす
    if (t.groupId === newGroupId && t.order >= newOrder) {
      return { ...t, order: t.order + 1 };
    }
    return t;
  });
  await saveTemplates(templates);
};

//* ショートカットキー関連のストレージ操作 */
export const saveShortcutKey = async (shortcutKey: string): Promise<void> => {
  const data = await loadStoredData();
  await browser.storage.sync.set({ data: { ...data, shortcutKey } });
};

export const loadShortcutKey = async (): Promise<string> => {
  const data = await loadStoredData();
  return data.shortcutKey;
};

export const resetStorage = async (): Promise<void> => {
  await browser.storage.sync.set({ data: DEFAULT_DATA });
}