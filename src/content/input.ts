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

  public updateKey(newKey: string) {
    if (this.key !== newKey) {
      this.key = newKey;
      this.cachedRegex = null;
    }
  }

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

  public insertTemplate = (template: Template) => {
    const el = this.inputElement;
    const regex = this.getRegex();

    const oldText = el instanceof HTMLTextAreaElement ? el.value : el.innerText;
    const newText = oldText.replace(regex, (match) => {
      const leadingSpace = match.startsWith(" ") ? " " : "";
      return leadingSpace + template.content;
    });

    if (el instanceof HTMLTextAreaElement) {
      el.value = newText;
      el.selectionStart = el.selectionEnd = newText.length;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      const insertText = template.content + "  ";
      const editorType = this.detectEditorType(el);

      if (editorType === "lexical" || editorType === "prosemirror") {
        if (!this.insertViaExecCommand(el, insertText)) {
          this.fallbackInsert(el, newText);
        }
      } else {
        if (!this.insertViaExecCommand(el, insertText)) {
          this.fallbackInsert(el, newText);
        }
      }
    }

    el.focus();
  };

  private getTextContent(): string {
    return this.inputElement instanceof HTMLTextAreaElement
      ? this.inputElement.value
      : this.inputElement.innerText;
  }

  private getRegex(): RegExp {
    if (this.cachedRegex) return this.cachedRegex;
    const escapedKey = this.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    this.cachedRegex = new RegExp(`(?:^|\\s)${escapedKey}([^${escapedKey}\\s]*)$`);
    return this.cachedRegex;
  }

  private detectEditorType(el: HTMLDivElement): "lexical" | "prosemirror" | "standard" {
    if (el.closest('[data-lexical-editor="true"]')) return "lexical";
    if (el.closest(".ProseMirror")) return "prosemirror";
    return "standard";
  }

  private insertViaExecCommand(el: HTMLDivElement, text: string): boolean {
    try {
      this.moveCursorToEnd(el);
      const success = document.execCommand("insertText", false, text);
      if (success) el.dispatchEvent(new InputEvent("input", { bubbles: true }));
      return success;
    } catch {
      return false;
    }
  }

  private fallbackInsert(el: HTMLDivElement, text: string) {
    el.textContent = text;
    this.moveCursorToEnd(el);
    el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }

  private moveCursorToEnd(el: HTMLDivElement) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    const textNode = el.childNodes[el.childNodes.length - 1] || el;
    const offset = textNode.textContent?.length || 0;
    try {
      range.setStart(textNode, offset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch {}
  }
}
