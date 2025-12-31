export class DomObserver {
  private curEl: HTMLElement | null = null;
  private observer: MutationObserver | null = null;
  private onFound: (el: HTMLElement) => void;
  private onLost?: () => void;

  constructor(opts: { onFound: (el: HTMLElement) => void; onLost?: () => void }) {
    this.onFound = opts.onFound;
    this.onLost = opts.onLost;
  }

  public start = () => {
    if (this.observer) this.observer.disconnect();

    this.observer = new MutationObserver(() => {
      // 既に入力欄を取得していてかつ、まだDOMに存在している場合
      if (this.curEl && document.body.contains(this.curEl) && this.isValidInput(this.curEl)) return;
      // 既に取得していた入力欄がDOMから削除されていた場合
      if (this.curEl && !document.body.contains(this.curEl)) {
        this.curEl = null;
        this.onLost?.();
      }
      this.assignTextArea();
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  };

  public stop = () => {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.curEl = null;
  };

  private assignTextArea = async (): Promise<void> => {
    const foundEl = this.findHTMLElement();

    if (foundEl && foundEl !== this.curEl) {
      this.curEl = foundEl;
      this.onFound(foundEl);
    } else if (!foundEl) {
      console.log('有効な入力欄が見つかりませんでした');
    }
  };

  //* テキストエリアまたはコンテンツエディタブル要素を検索
  private findHTMLElement = (): HTMLElement | null => {
    const selectors =[
      '[contenteditable="true"]',
      'textarea:not([disabled]):not([readonly])'
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

  //* 要素が有効な入力欄かどうかを判定
  private isValidInput = (element: HTMLElement): boolean => {
    if (!element || !element.isConnected) return false;

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.offsetParent !== null &&
      rect.width > 0 &&
      rect.height > 0
    );
  };
}
