import browser from 'webextension-polyfill';
import type { Template, StorageData } from '../types/index';

const DEFAULT_DATA: StorageData = {
  templates: [],
  triggerCommand: '/',
};

export const getStorageData = async (): Promise<StorageData> => {
  const result = await browser.storage.sync.get('data');
  return (result.data as StorageData) || DEFAULT_DATA;
};

export const saveTemplates = async (templates: Template[]): Promise<void> => {
  const data = await getStorageData();
  await browser.storage.sync.set({ data: { ...data, templates } });
};

export const addTemplate = async (template: Template): Promise<void> => {
  const data = await getStorageData();
  await saveTemplates([...data.templates, template]);
};

export const updateTemplate = async (id: string, updates: Partial<Template>): Promise<void> => {
  const data = await getStorageData();
  const templates = data.templates.map(t => 
    t.id === id ? { ...t, ...updates } : t
  );
  await saveTemplates(templates);
};

export const deleteTemplate = async (id: string): Promise<void> => {
  const data = await getStorageData();
  const templates = data.templates.filter(t => t.id !== id);
  await saveTemplates(templates);
};