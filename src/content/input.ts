import type { Template } from "../types";

export class InputHandler {
  inputElement: HTMLTextAreaElement | HTMLDivElement;
  key: string;
  onQueryChange: (query: string | null) => void;

  constructor(inputElement: HTMLTextAreaElement | HTMLDivElement, key: string, onQueryChange: (query: string | null) => void) {
    this.inputElement = inputElement;
    this.key = key;
    this.onQueryChange = onQueryChange;
  }

  public updateKey(newKey: string) {
    this.key = newKey;
    console.log('InputHandlerのkey更新:', newKey);
  }

  public handleInput = () => {
    const match = this.checkFormat(this.inputElement);
    try {
      if (match) {
        const query = match[1] ?? '';
        console.log('トリガー検知:', this.key, query);
        this.onQueryChange(query);
      } else {
        this.onQueryChange(null);
      }
    } catch (e) {
      console.error('Error in handleInput:', e);
    }
  };

  //** テンプレートを挿入 */
  public insertTemplate = (template: Template) => {
    const el = this.inputElement;
    const regex = this.getRegex();

    const oldText = el instanceof HTMLTextAreaElement ? el.value : el.innerText;

    const newText = oldText.replace(regex, (match) => {
      const leadingSpace = match.startsWith(' ') ? ' ' : '';
      return leadingSpace + template.content;
    });

    // テキストを更新し、キャレットを末尾に移動
    if (el instanceof HTMLTextAreaElement) {
      console.log('Textareaにテンプレート挿入:', template.name);
      el.value = newText;
      el.selectionStart = el.selectionEnd = newText.length;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      console.log('ContentEditableにテンプレート挿入:', template.name);
      el.innerText = newText;
      const range = document.createRange();
      const sel = window.getSelection();
      
      const textNode = el.childNodes[el.childNodes.length - 1] || el;
      const offset = textNode.textContent?.length || 0;

      try {
        range.setStart(textNode, offset);
        range.collapse(true);

        sel?.removeAllRanges();
        sel?.addRange(range);
      } catch (e) {
        console.error('カーソル位置の設定に失敗:', e);
      }
      el.dispatchEvent(new InputEvent('input', { bubbles: true ,cancelable: true}));
    }

    el.focus();
  };

  private checkFormat = (target: HTMLTextAreaElement | HTMLDivElement) => {
    const text = target instanceof HTMLTextAreaElement
      ? target.value
      : target.innerText;

    return text.match(this.getRegex());
  };

  private getRegex = () => {
    const escapedKey = this.escapeRegex(this.key);
    return new RegExp(`(?:^|\\s)${escapedKey}([^${escapedKey}\\s]*)$`);
  };

  private escapeRegex = (text: string) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
}