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
        this.curTextArea = null;
      }

      this.assignTextArea();
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  private assignTextArea = async (): Promise<void> => {
    const textArea = this.findTextAreas();
    
    if (textArea && textArea !== this.curTextArea) {
      this.curTextArea = textArea;
      this.onFound(textArea);
    } else if (!textArea) {
      console.log('有効な入力欄が見つかりませんでした');
    }
  }

  public stop = () => {
  if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.curTextArea = null;
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
    if (!element || !element.isConnected) return false;
    
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && 
          style.visibility !== 'hidden' &&
          element.offsetParent !== null &&
          rect.width > 0 &&
          rect.height > 0
  };
}