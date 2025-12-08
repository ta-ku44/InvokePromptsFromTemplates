export class DomObserver {
  private curTextArea: HTMLElement | null = null; 
  private observer: MutationObserver | null = null;
  private onFound: (el: HTMLElement) => void;

  constructor(opts: { onFound: (el: HTMLElement) => void }) {
    this.onFound = opts.onFound;
  }

  public start = () => {
    if (this.observer) this.observer.disconnect();

    this.observer = new MutationObserver(() => {
      // 既に入力欄を取得していてかつ、まだDOMに存在している場合
      if (this.curTextArea && document.body.contains(this.curTextArea) && this.isValidInput(this.curTextArea)) return;
      // 既に取得していた入力欄がDOMから削除されていた場合
      if (this.curTextArea && !document.body.contains(this.curTextArea)) {
        console.log('現在の入力欄がDOMから削除された');
        this.cleanUp();
      }
      this.assignTextArea();
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  private assignTextArea = () => {
    const textArea = this.findTextAreas();
    if (textArea && textArea !== this.curTextArea) {
      console.log('新しい入力欄を取得した');
      this.curTextArea = textArea;

      this.onFound(textArea);
    }
  }

  private cleanUp = () => {
    if (this.curTextArea) {
      this.curTextArea = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private findTextAreas = (): HTMLElement | null => {
    const selectors = [
      '[contenteditable="true"]', // contenteditableを探索
      'textarea:not([disabled]):not([readonly])', // textareaを探索
      '[role="textbox"]', // textboxを探索
    ];

    for (const s of selectors) {
      const elements = document.querySelectorAll(s);
      for (const el of elements) {
        const htmlEl = el as HTMLElement;
        if (this.isValidInput(htmlEl)) return htmlEl;
      }
    }
    return null;
  };

  //* 入力欄が有効かチェック */
  private isValidInput = (element: HTMLElement): boolean => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && 
          style.visibility !== 'hidden' &&
          element.offsetParent !== null &&
          rect.width > 0 &&
          rect.height > 0
  };
}