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

  public handleInput = async () => {
    const match = await this.checkFormat(this.inputElement);
    if (match) {
      const query = match[1];
      console.log('トリガー検知:', this.key, 'query:', query);
      this.onQueryChange(query);
    } else {
      this.onQueryChange(null);
    }
  };

  public insertTemplate = (template: Template) => {
    const el = this.inputElement;
    const oldText = el instanceof HTMLTextAreaElement ? el.value : el.innerText;

    const newText = oldText.replace(this.getRegex(), (match) => {
      const leadingSpace = match.startsWith(' ') ? ' ' : '';
      return leadingSpace + template.content;
    });

    if (el instanceof HTMLTextAreaElement) {
      el.value = newText;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      el.innerText = newText;
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }

    el.focus();
  };

  private checkFormat = async (target: HTMLTextAreaElement | HTMLDivElement) => {
    const text = target instanceof HTMLTextAreaElement
      ? target.value
      : target.innerText;

    return text.match(this.getRegex());
  };

  private getRegex = () => {
    return new RegExp(`(?:^|\\s)${this.key}([^${this.key}\\s]*)$`);
  };
}
