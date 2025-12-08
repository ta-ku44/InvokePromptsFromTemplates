import { DomObserver } from './dom';
import { InputHandler } from './input';
import { showSuggest, hideSuggest } from './suggest/suggest.tsx';
import browser from 'webextension-polyfill';

let key = '#';
let inputHandler: InputHandler | null = null;
let curInputEl: HTMLElement | null = null;

const loadKey = async () => {
  const result = await browser.storage.sync.get('data');
  key = (result.data as { shortcutKey?: string })?.shortcutKey || '#';
  console.log('ロードされたショートカットキー:', key);

  if (inputHandler) {
    inputHandler.updateKey(key);
  }
};

const init = async () => {
  await loadKey();

  const domObserver = new DomObserver({
    onFound: (el: HTMLElement) => {
      console.log('入力欄を検出し InputHandler を初期化:', el);
      if (curInputEl === el){
        curInputEl = el;
        inputHandler = new InputHandler(el as HTMLTextAreaElement | HTMLDivElement, key,
          (input) => {
            input ? showSuggest(input, el, (template) => { inputHandler?.insertTemplate(template); }) : hideSuggest();
          }
        );
      el.addEventListener('input', inputHandler.handleInput);
      }
    }
  });

  domObserver.start();
};

//* ショートカットキー変更を監視 */
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.data) {
    const newKey = (changes.data.newValue as { shortcutKey?: string })?.shortcutKey;
    if (typeof newKey === 'string') {
      key = newKey;
      console.log('ショートカットキー更新:', key);
      if (inputHandler) {
        inputHandler.updateKey(key);
      }
    }
  }
});

init();