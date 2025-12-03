import browser from 'webextension-polyfill';
import type { Template, StorageData } from '../types/index';

const DEFAULT_DATA: StorageData = {
  templates: [],
  shortcutKey: '#',
};

export const loadStoredData = async (): Promise<StorageData> => {
  const result = await browser.storage.sync.get('data');
  return (result.data as StorageData) || DEFAULT_DATA;
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