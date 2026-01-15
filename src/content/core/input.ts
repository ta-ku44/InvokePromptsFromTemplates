import { insertIntoInputBox, /*focusAtPlaceholderAndClear,*/ replaceVariables } from '../utils/editor';
import { showModal } from '../ui/model';

export class InputProcessor {
  private inputBox: HTMLElement;
  private key: string;
  private cachedRegex: RegExp | null = null;
  private onQueryChange: (query: string | null) => void;

  constructor(inputBox: HTMLElement, key: string, onQueryChange: (query: string | null) => void) {
    this.inputBox = inputBox;
    this.key = key;
    this.onQueryChange = onQueryChange;
  }

  public readInputContent = () => {
    const text = this.inputBox instanceof HTMLTextAreaElement ? this.inputBox.value : this.inputBox.innerText;
    const match = text.match(this.getRegex());

    try {
      if (!match) {
        this.onQueryChange(null);
        return;
      }
      this.onQueryChange(match[1] ?? '');
    } catch (error) {
      console.error('handleInputでエラーを検出:', error);
    }
  };

  public insertPrompt(prompt: string): void {
    const inputBox = this.inputBox;
    // テキスト挿入
    insertIntoInputBox(inputBox, this.getRegex(), prompt);

    // プレースホルダー処理
    requestAnimationFrame(() => {
      this.placeholder(prompt);
    });

    inputBox.focus();
  }

  private placeholder(prompt: string): void {
    const matches = [...prompt.matchAll(/\{\{([^}]+)\}\}/g)]; // {{variable}}の形式
    if (matches.length === 0) return;

    const variables = matches.map((m) => m[1]);

    showModal(variables, (replacements: Record<string, string>) => {
      replaceVariables(replacements, this.inputBox);
    });
  }

  public updateKey(newKey: string): void {
    if (this.key !== newKey) {
      this.key = newKey;
      this.cachedRegex = null;
    }
  }

  //* 入力形式の正規表現を取得
  private getRegex(): RegExp {
    if (this.cachedRegex) return this.cachedRegex;
    const escapedKey = this.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    this.cachedRegex = new RegExp(`(?:^|\\s)${escapedKey}(\\S*)$`);
    return this.cachedRegex;
  }
}
