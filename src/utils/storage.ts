import browser from 'webextension-polyfill';
import type { Template, StorageData } from '../types/index';

const DEFAULT_DATA: StorageData = {
  templates: [],
  triggerCommand: '/',
};

/** ストレージからデータを取得 */
export const getStorageData = async (): Promise<StorageData> => {
  const result = await browser.storage.sync.get('data');
  return (result.data as StorageData) || DEFAULT_DATA;
};

/** ストレージにデータを保存 */
export const saveTemplates = async (templates: Template[]): Promise<void> => {
  const data = await getStorageData();
  await browser.storage.sync.set({ data: { ...data, templates } });
};

/** テンプレートを追加 */
export const addTemplate = async (template: Template): Promise<void> => {
  const data = await getStorageData();
  await saveTemplates([...data.templates, template]);
};

/** テンプレートを更新 */
export const updateTemplate = async (id: string, updates: Partial<Template>): Promise<void> => {
  const data = await getStorageData();
  const templates = data.templates.map(t => 
    t.id === id ? { ...t, ...updates } : t
  );
  await saveTemplates(templates);
};

/** テンプレートを削除 */
export const deleteTemplate = async (id: string): Promise<void> => {
  const data = await getStorageData();
  const templates = data.templates.filter(t => t.id !== id);
  await saveTemplates(templates);
};