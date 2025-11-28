//import React from 'react';
import ReactDOM from 'react-dom/client';
import TemplateDropdown from './TemplateDropdown';
import { getStorageData } from '../utils/storage';
import type { Template } from '../types';

console.log('PromptTemplate content script を読み込み');

let dropdownRoot: ReactDOM.Root | null = null;
let dropdownContainer: HTMLDivElement | null = null;
//let currentTextarea: HTMLElement | null = null;

/** スクリプトを初期化 */
const init = () => {
  console.log('PromptTemplateを初期化:',window.location.href);

  const checkInterval = setInterval(() => {
    const textAreas = findTextAreas();{
      if (textAreas) {
        console.log('入力欄を検出:', textAreas);
        textAreas.addEventListener('input', handleInput);
        clearInterval(checkInterval);
      } else {
        console.warn('入力欄をまだ検出できていません');
      }
    }
  }, 1000);

  setTimeout(() => clearInterval(checkInterval), 10000);
}

/** 入力欄が有効かチェック */
const isValidInput = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         element.offsetParent !== null &&
         element.getBoundingClientRect().width > 0 &&
         element.getBoundingClientRect().height > 0
};

/** 入力欄を探索 */
const findTextAreas = (): HTMLElement | null => {
  const selectors = [
    '[role="textbox"]', // textboxを探索
    'textarea:not([disabled]):not([readonly])', // textareaを探索
    '[contenteditable="true"]' // contenteditableを探索
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const htmlEl = el as HTMLElement;
      if (isValidInput(htmlEl)) return htmlEl;
      }
  }
  return null;
};

/** コマンドを呼び出す */
const handleInput = async (event: Event) => {
  const target = event.target as HTMLTextAreaElement | HTMLDivElement;
  const text = target.textContent || (target as HTMLTextAreaElement).value || '';

  // keyCommandが入力されたかチェック
  const match = text.match(/;;(\w*)$/);
  if (match) {
    const query = match[1];
    console.log('コマンド検出:', query);
    await showDropdown(query, target as HTMLElement);
  } else {
    hideDropdown();
  }
}

/** ドロップダウンを表示 */
const showDropdown = async (query: string, textarea: HTMLElement) => {
  const data = await getStorageData();
  const templates = data.templates;

  if (templates.length === 0) {
    console.log('テンプレートが登録されていません');
    return;
  }

  // ドロップダウンの位置を計算
  const rect = textarea.getBoundingClientRect();
  const position = {
    top: rect.bottom + window.scrollY + 5,
    left: rect.left + window.scrollX,
  };
  // コンテナがなければ作成
  if (!dropdownContainer) {
    dropdownContainer = document.createElement('div');
    dropdownContainer.id = 'prompt-template-dropdown';
    document.body.appendChild(dropdownContainer);
    dropdownRoot = ReactDOM.createRoot(dropdownContainer);
  }
  // ドロップダウンを表示
  dropdownRoot?.render(
    <TemplateDropdown
      templates={templates}
      query={query}
      position={position}
      onSelect={handleTemplateSelect}
      onClose={hideDropdown}
    />
  );
}

/** ドロップダウンを非表示 */
const hideDropdown = () => {
  if (dropdownRoot && dropdownContainer) {
    dropdownRoot.unmount();
    dropdownContainer.remove();
    dropdownRoot = null;
    dropdownContainer = null;
  }
}

/** テンプレート選択時の処理 */
const handleTemplateSelect = (template: Template) => {
  console.log('テンプレート選択:', template);

  // TODO: テンプレート内容を入力欄に挿入

  hideDropdown
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}