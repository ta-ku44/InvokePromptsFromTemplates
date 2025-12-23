import type { Template } from "../types";

export class InputHandler {
  private cachedRegex: RegExp | null = null;

  inputElement: HTMLTextAreaElement | HTMLDivElement;
  key: string;
  onQueryChange: (query: string | null) => void;

  constructor(inputElement: HTMLTextAreaElement | HTMLDivElement, key: string, onQueryChange: (query: string | null) => void) {
    this.inputElement = inputElement;
    this.key = key;
    this.onQueryChange = onQueryChange;
  }

  //* トリガーキーを更新
  public updateKey(newKey: string) {
    if (this.key !== newKey) {
      this.key = newKey;
      this.cachedRegex = null;
    }
  }

  //* 入力イベントを処理
  public handleInput = () => {
    const text = this.getTextContent();
    const match = text.match(this.getRegex());
    try {
      if (!match) {
        this.onQueryChange(null);
        return;
      }
      this.onQueryChange(match[1] ?? "");
    } catch (e) {
      console.error('handleInputでエラーを検出:', e);
    }
  };

  //* テンプレートを挿入
  public insertTemplate = (template: Template) => {
    const el = this.inputElement;
    const regex = this.getRegex();

    const oldText = el instanceof HTMLTextAreaElement ? el.value : el.innerText;
    const newText = oldText.replace(regex, (match) => {
      const leadingSpace = match.startsWith(" ") ? " " : "";
      return leadingSpace + template.content;
    });

    if (el instanceof HTMLTextAreaElement) {
      // テキストエリアの場合
      el.value = newText;
      el.selectionStart = el.selectionEnd = newText.length;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      // ContentEditable要素の場合
      const editorType = this.detectEditorType(el);

      if (editorType === "prosemirror") {
        const type = this.detectProseMirrorType(el);
        switch (type) {
          case "tiptap":
            console.log('Tiptapタイプを検出、execCommandで挿入を試行');
            if (!this.insertViaExecCommand(el, template.content)) {
              this.fallbackInsert(el, template.content);
            }
            break;
          case "prosemirror":
            console.log('ProseMirrorタイプを検出、innerTextで挿入を実行');
            this.insertViaInnerText(el, template.content);
            break;
          default:
            console.log('不明なProseMirrorタイプ、フォールバック挿入を実行');
            this.fallbackInsert(el, template.content);
            break;
        }
      } else if (editorType === "lexical") {

      } else {
        // ContentEditable標準の場合
        if (!this.insertViaExecCommand(el, template.content)) {
          this.fallbackInsert(el, template.content);
        }
      }
    }

    el.focus();
  };

  //* テキスト内容を取得
  private getTextContent(): string {
    return this.inputElement instanceof HTMLTextAreaElement
      ? this.inputElement.value
      : this.inputElement.innerText;
  }

  //* 正規表現を取得
  private getRegex(): RegExp {
    if (this.cachedRegex) return this.cachedRegex;
    const escapedKey = this.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    this.cachedRegex = new RegExp(`(?:^|\\s)${escapedKey}(\\S*)$`);
    return this.cachedRegex;
  }

  //* エディタータイプを返す
  private detectEditorType(el: HTMLDivElement): "lexical" | "prosemirror" | "standard" {
    if (el.closest('[data-lexical-editor="true"]')) return "lexical";
    if (el.closest(".ProseMirror")) return "prosemirror";
    return "standard";
  };

  //* ProseMirrorタイプを返す
  private detectProseMirrorType(el: HTMLDivElement): "tiptap" | "prosemirror" | "unknown" {
    if (!el.isContentEditable) return "unknown";
    if (!el.classList.contains("ProseMirror")) return "unknown";

    // tiptap判定
    if ((el as any).__tiptapEditor || el.closest(".tiptap") || el.closest("[data-editor='tiptap']")) {
      return "tiptap";
    }
    // 要素内になければProseMirrorと判定
    return "prosemirror";
  }

  //* innerTextで挿入を試みる
  private insertViaInnerText = (el: HTMLDivElement, text: string) => {
    try {
      el.innerText = text;
      this.moveCursorToEnd(el);
      el.dispatchEvent(new InputEvent("input", { bubbles: true }));
    } catch {
      console.log('innerTextによる挿入に失敗');
    }
  }

  //* execCommandで挿入を試みる
  private insertViaExecCommand(el: HTMLDivElement, text: string): boolean {
    try {
      this.moveCursorToEnd(el);
      const success = document.execCommand("insertText", false, text);
      if (success) el.dispatchEvent(new InputEvent("input", { bubbles: true }));
      return success;
    } catch {
      console.log('execCommandによる挿入に失敗');
      return false;
    }
  }

  //* フォールバック挿入
  private fallbackInsert(el: HTMLDivElement, text: string) {
    el.textContent = text;
    this.moveCursorToEnd(el);
    el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }

  //* カーソルを末尾に移動
  private moveCursorToEnd(el: HTMLDivElement) {
    const selection = this.inputElement.ownerDocument?.getSelection();
    if (!selection) return;
    const range = document.createRange();
    const textNode = el.childNodes[el.childNodes.length - 1] || el;
    const offset = textNode.textContent?.length || 0;
    try {
      range.setStart(textNode, offset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch(e) {
      console.error('カーソルの移動でエラーを検出:', e);
    }
  }
}