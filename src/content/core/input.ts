import { insertIntoTextArea, insertIntoDiv } from '../utils/editor';

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

  public readInputContent() {
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
  }

  public insertPrompt(prompt: string): void {
    const inputBox = this.inputBox;

    if (inputBox instanceof HTMLTextAreaElement) {
      // textarea への挿入

      insertIntoTextArea(inputBox, this.getRegex(), prompt);
    } else if (inputBox instanceof HTMLDivElement) {
      // contenteditable への挿入
      insertIntoDiv(inputBox, this.getRegex(), prompt);
    } else {
      console.error('Unsupported element type:', inputBox.tagName);
      return;
    }

    // プレースホルダー処理
    requestAnimationFrame(() => {
      this.placeholder(prompt);
    });

    inputBox.focus();
  }

  private placeholder(prompt: string): void {
    const match = prompt.match(/\{\{(\w+)\}\}/);
    if (!match) return;

    if (match.length == 1) {
      // TODO: 変数を削除しその位置にフォーカス
      const deletedLength = this.deleteVariable(match);
      this.moveToVariable(deletedLength);
    } else {
      // TODO: モーダルを描画して変数選択
      this.viewModel(match);
    }
  }

  public updateKey(newKey: string): void {
    if (this.key !== newKey) {
      this.key = newKey;
      this.cachedRegex = null;
    }
  }

  //* 正規表現を取得
  private getRegex(): RegExp {
    if (this.cachedRegex) return this.cachedRegex;
    const escapedKey = this.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    this.cachedRegex = new RegExp(`(?:^|\\s)${escapedKey}(\\S*)$`);
    return this.cachedRegex;
  }

  private deleteVariable(match: RegExpMatchArray): number {
    return 0;
  }

  private moveToVariable(deletedLength: number): void {}

  private viewModel(match: RegExpMatchArray): void {}
}
