import { DomObserver } from './core/dom.ts';
import { InputProcessor } from './core/input.ts';
import { showSuggest, hideSuggest, clearCachedData } from './ui/suggest.tsx';
import browser from 'webextension-polyfill';

let inputProcessor: InputProcessor | null = null;
let key: string = '#';
let curInputBox: HTMLElement | null = null;

async function init() {
  console.log('PromptLibrary content script initialized');
  await loadKey();
  console.log('Key loaded:', key);

  const domObserver = new DomObserver({
    onFound: setup,
    onLost: cleanup,
  });

  domObserver.start();
  console.log('DOM Observer started');

  window.addEventListener('beforeunload', () => {
    domObserver.stop();
    cleanup();
  });
}

function setup(el: HTMLElement): void {
  if (curInputBox === el) return;
  cleanup();
  curInputBox = el;
  inputProcessor = new InputProcessor(curInputBox, key, (query) => {
    if (query !== null) {
      showSuggest(curInputBox!, query, (template) => inputProcessor?.insertPrompt(template.content));
      console.log('Query detected, showing suggestions');
    } else {
      hideSuggest();
      console.log('No query detected.');
    }
  });
  curInputBox.addEventListener('input', inputProcessor.readInputContent);
}

function cleanup(): void {
  if (curInputBox && inputProcessor) curInputBox.removeEventListener('input', inputProcessor.readInputContent);
  hideSuggest();
  inputProcessor = null;
  curInputBox = null;
}

async function loadKey(): Promise<void> {
  const result = await browser.storage.sync.get('data');
  key = (result.data as { shortcutKey: string }).shortcutKey || '#';

  if (inputProcessor) {
    inputProcessor.updateKey(key);
  }
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes.data) {
    clearCachedData();
    const newKey = (changes.data.newValue as { shortcutKey: string })?.shortcutKey;
    if (typeof newKey === 'string') {
      key = newKey;
      if (inputProcessor) {
        inputProcessor.updateKey(key);
      }
    }
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
