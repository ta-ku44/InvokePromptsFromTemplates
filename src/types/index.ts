export interface Template {
  id: number;
  groupId: number | null;
  name: string;
  content: string;
  order: number;
}

export interface Group {
  id: number;
  name: string;
  order: number;
}

export interface StorageData {
  templates: Template[];
  groups: Group[];
  shortcutKey: string;
}
