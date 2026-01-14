import { insertIntoInputBox, focusAtPlaceholderAndClear } from '../utils/editor';

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
    const matches = [...prompt.matchAll(/\{\{([^}]*)\}\}/g)]; // {{variable}}の形式
    if (matches.length === 0) return;

    if (matches.length === 1) {
      // 変数を削除してフォーカス
      const variable = matches[0][0];
      focusAtPlaceholderAndClear(variable, this.inputBox);
    } else {
      // TODO: モーダルを描画して変数選択
      this.showVariableModal(matches);
    }
  }

  private showVariableModal(matches: RegExpMatchArray[]): void {
    const variables = matches.map((m) => m[1]);

    // モーダルを表示して変数入力を受け取る

    const onSubmit = (values: Record<string, string>) => {
      
    };
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
