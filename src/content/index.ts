import { DomObserver } from './dom.ts';
import { InputHandler } from './input.ts';
import { showSuggest, hideSuggest, clearCachedData } from './suggest.tsx';
import browser from 'webextension-polyfill';

let key = '#';
let inputHandler: InputHandler | null = null;
let curInputEl: HTMLElement | null = null;

const init = async () => {
  await loadKey();

  const domObserver = new DomObserver({
    onFound: setup,
    onLost: cleanup,
  });
  
  domObserver.start();

  window.addEventListener('beforeunload', () => {
    domObserver.stop();
    cleanup();
  });
};

const setup = (el: HTMLElement) => {
  if (curInputEl === el) return;
  cleanup();
  curInputEl = el;
  inputHandler = new InputHandler(curInputEl, key, (query) => {
    if (query !== null) {
      showSuggest(curInputEl!, query, (template) => inputHandler?.insertPrompt(template));
    } else {
      hideSuggest();
    }
  });
  curInputEl.addEventListener('input', inputHandler.handleInput);
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
    clearCachedData();
    const newKey = (changes.data.newValue as { shortcutKey: string })?.shortcutKey;
    if (typeof newKey === 'string') {
      key = newKey;
      if (inputHandler) {
        inputHandler.updateKey(key);
      }
    }
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
