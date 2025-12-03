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
  return {
    templates: data?.templates ?? DEFAULT_DATA.templates,
    groups: data?.groups ?? DEFAULT_DATA.groups,
    shortcutKey: data?.shortcutKey ?? DEFAULT_DATA.shortcutKey,
  };
};

export const saveTemplates = async (templates: Template[]): Promise<void> => {
  const data = await loadStoredData();
  await browser.storage.sync.set({ data: { ...data, templates } });
};

export const addTemplate = async (template: Template): Promise<void> => {
  const data = await loadStoredData();
  await saveTemplates([...data.templates, template]);
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

//* Group関連のストレージ操作 */
export const saveGroups = async (groups: Group[]): Promise<void> => {
  const data = await loadStoredData();
  await browser.storage.sync.set({ data: { ...data, groups } });
}

export const addGroup = async (group: Group): Promise<void> => {
  const data = await loadStoredData();
  await saveGroups([...data.groups, group]);
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
  await saveGroups(groups);
};

export const deleteAllGroups = async (): Promise<void> => {
  await saveGroups([]);
};

export const getTemplatesByGroup = async (groupId: number): Promise<Template[]> => {
  const data = await loadStoredData();
  return data.templates.filter(t => t.groupId === groupId);
};

export const prompts: Template[] = [
  { id: 1, groupId: 1, name: 'Summary', content: '#以下の文章を３つの要素にまとめて要約してください。 \n\n "textを入力してください"' },
  { id: 2, groupId: 1, name: 'Analyze', content: '#以下の文章を分析してください。 \n\n "textを入力してください"' },
  { id: 3, groupId: 2, name: 'Check-Word', content: '#これは正しい語でしょうか？その語を定義し、さらにその文脈で適切か（あるいは適切でないか）を説明してください。 \n\n "textを入力してください"' },
  { id: 4, groupId: 2, name: 'Check-Grammar', content: '#以下の文章の文法をチェックし、必要に応じて修正してください。 \n\n "textを入力してください"' },
  { id: 5, groupId: 3, name: 'Digest', content: '#以下の動画を要約してください。 \n\n "動画のリンクを入力してください"' },
  { id: 6, groupId: 4, name: 'Explain-Code', content: '#以下のコードの動作を説明してください。 \n\n "コードを入力してください"' },
  { id: 7, groupId: 4, name: 'Optimize-Code', content: '#以下のコードを最適化してください。 \n\n "コードを入力してください"' },
];
export const groups: Group[] = [
  { id: 1, name: 'General' },
  { id: 2, name: 'Writing' },
  { id: 3, name: 'Video' },
  { id: 4, name: 'Coding' },
];