import React, { useEffect, useRef, useMemo } from 'react';
import { createRoot ,type Root } from 'react-dom/client';
import useAutocomplete from '@mui/lab/useAutocomplete';
import './styles.css';
import { loadStoredData } from '../utils/storage';
import type { Template, Group } from '../types/index';
import { insertTemplate } from './index';

let root: Root | null = null;
let container: HTMLElement | null = null;

/** サジェストを表示 */
const viewSuggest = async (query: string, textArea: HTMLElement) => {
  
  // プロンプトのテンプレートを取得
  const data = await loadStoredData();
  const templates = data.templates.filter(t =>
    t.name.includes(query) || t.content.includes(query)
  );

  if (templates.length === 0) {
    console.log('該当するテンプレートが存在しない');
    hideSuggest();
    return;
  }

  // TODO: 入力欄の位置を基準にサジェストの位置を決定

  // 既存のコンテナが存在しなければコンテナを作成
  if (!container) {
    container = document.createElement('div');
    container.id = 'pt-suggest-root';
    container.style.position = 'absolute';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    root = createRoot(container);
  }

  // container.style.top = `${position.top}px`;
  // container.style.left = `${position.left}px`;
  // container.style.width = `${rect.width}px`;
  // console.log('サジェストコンテナの位置を設定:', container.style.top, container.style.left);

  root?.render(
    <Suggest
      templates={templates}
      groups={data.groups}
      onSelect={insertTemplate}
      onClose={hideSuggest}
    />
  );
  console.log('サジェストを表示しました');
};

/** サジェストを非表示 */
const hideSuggest = () => {
  if (root) {
    root.unmount();
    root = null;
  }
  if (container) {
    container.remove();
    container = null;
  }

  console.log('サジェストを非表示にしました');
};

interface SuggestProps {
  templates: Template[];
  groups: Group[];
  onSelect: (template: Template) => void;
  onClose: () => void;
}

interface GroupSection {
  title: string;
  items: Template[];
}

const Suggest: React.FC<SuggestProps> = ({templates, groups, onSelect, onClose}) => {
  
  return (
    <div className="pt-suggest-container">

    </div>
  );
};

export { viewSuggest, hideSuggest };