export interface Template {
  id: number;
  groupId: number;
  name: string;
  content: string;
}

export interface Group {
  id: number;
  name: string;
}

export interface StorageData {
  templates: Template[];
  groups: Group[];
  shortcutKey: string;
}