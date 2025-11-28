export interface Template {
  id: string;
  name: string;
  content: string;
}

export interface StorageData {
  templates: Template[];
  triggerCommand: string;
}