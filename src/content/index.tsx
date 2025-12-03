import type { Template } from "../types";
import { viewSuggest, hideSuggest } from "./Suggest";

let currentTextArea: HTMLElement | null = null;
let observer: MutationObserver | null = null;

const init = async () => {
  console.log('PromptTemplateを初期化:',window.location.href);

  if (observer) observer.disconnect();
  tryFindAndRegister();

  observer = new MutationObserver(() => {
    // 既に入力欄を取得していて、かつまだDOMに存在している場合
    if (currentTextArea && document.body.contains(currentTextArea) && isValidInput(currentTextArea)) return;
    // 既に取得していた入力欄がDOMから削除されていた場合
    if (currentTextArea && !document.body.contains(currentTextArea)) {
      console.log('現在の入力欄がDOMから削除された');
      cleanUp();
    }
    tryFindAndRegister();
  });
 
  observer.observe(document.body, { childList: true, subtree: true });
}

const tryFindAndRegister = () => {
  const textArea = findTextAreas();
  if (textArea && textArea !== currentTextArea) {
    console.log('新しい入力欄を取得した');
    registerTextArea(textArea);
  } 
}

const registerTextArea = (textarea: HTMLElement) => {
  cleanUp();

  currentTextArea = textarea;
  textarea.addEventListener('input', handleInput);

  observeTextArea();
  console.log('入力欄を登録:', textarea);
}

const cleanUp = () => {
  if (currentTextArea) {
    currentTextArea.removeEventListener('input', handleInput);
    currentTextArea = null;
  }
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

const observeTextArea = () => {
  observer = new MutationObserver(()=> {
    if (currentTextArea && !document.contains(currentTextArea)) {
      console.log('入力欄がDOMから削除、監視を再開');
      init();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

//* 入力欄が有効かチェック */
const isValidInput = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         element.offsetParent !== null &&
         element.getBoundingClientRect().width > 0 &&
         element.getBoundingClientRect().height > 0
};

const findTextAreas = (): HTMLElement | null => {
  const selectors = [
    '[role="textbox"]', // textboxを探索
    'textarea:not([disabled]):not([readonly])', // textareaを探索
    '[contenteditable="true"]' // contenteditableを探索
  ];

  for (const s of selectors) {
    const elements = document.querySelectorAll(s);
    for (const el of elements) {
      const htmlEl = el as HTMLElement;
      if (isValidInput(htmlEl)) return htmlEl;
      }
  }
  return null;
};

//** 入力イベントのハンドラ */
const handleInput = async (event: Event) => {
  const target = event.target as HTMLTextAreaElement | HTMLDivElement;
  const text = target.textContent || (target as HTMLTextAreaElement).value || '';
  
  const match = text.match(/#(\w*)$/);
  if (match) {
    const query = match[1];
    await viewSuggest(query, currentTextArea);
  } else {
    hideSuggest();
  }
}

const insertTemplate = (template: Template) => {
  if (!currentTextArea) return;

  const isTextArea = currentTextArea.tagName.toLowerCase() === 'textarea';
  
  if (isTextArea) {
    // textarea の場合
    const textarea = currentTextArea as HTMLTextAreaElement;
    const text = textarea.value;
    const newText = text.replace(/#\w*$/, template.content);
    textarea.value = newText;
    
    // カーソルを末尾に移動
    textarea.selectionStart = textarea.selectionEnd = newText.length;
    
    // inputイベントを発火
    textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
  } else {
    // contenteditable / role="textbox" の場合
    const text = currentTextArea.textContent || '';
    const newText = text.replace(/#\w*$/, template.content);
    currentTextArea.textContent = newText;
    
    // カーソルを末尾に移動
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(currentTextArea);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
    
    // inputイベントを発火
    currentTextArea.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }
  currentTextArea.focus();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { insertTemplate as handleTemplateSelect };