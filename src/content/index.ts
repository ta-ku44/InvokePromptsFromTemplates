import { DomObserver } from './dom.ts';
import { InputHandler } from './input.ts';
import { showSuggest, hideSuggest, clearSuggestCache } from './suggest.tsx';
import browser from 'webextension-polyfill';

let key = '#';
let inputHandler: InputHandler | null = null;
let curInputEl: HTMLElement | null = null;

const init = async () => {
  await loadKey();

  const domObserver = new DomObserver({
    onFound: (el) => {
      if (curInputEl === el) return;
      console.log('入力欄を検出:', el);
      cleanup();
      curInputEl = el;
      inputHandler = new InputHandler(curInputEl, key, (query) => {
        if (query !== null) {
          showSuggest({
            query,
            curInputEl,
            onInsert: (template) => inputHandler?.insertPrompt(template),
          });
        } else {
          hideSuggest();
        }
      });
      curInputEl.addEventListener('input', inputHandler.handleInput);
    },
    onLost: () => {
      console.log('入力欄が削除されたためクリーンアップを実行');
      cleanup();
    },
  });

  domObserver.start();

  window.addEventListener('beforeunload', () => {
    domObserver.stop();
    cleanup();
  });
};

const cleanup = () => {
  if (curInputEl && inputHandler) curInputEl.removeEventListener('input', inputHandler.handleInput);
  hideSuggest();
  inputHandler = null;
  curInputEl = null;
};

const loadKey = async () => {
  const result = await browser.storage.sync.get('data');
  key = (result.data as { shortcutKey: string }).shortcutKey || '#';

  if (inputHandler) {
    inputHandler.updateKey(key);
  }
};

browser.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes.data) {
    clearSuggestCache();
    const newKey = (changes.data.newValue as { shortcutKey: string })?.shortcutKey;
    if (typeof newKey !== 'string') return;
    key = newKey;
    if (inputHandler) {
      inputHandler.updateKey(key);
    }
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
