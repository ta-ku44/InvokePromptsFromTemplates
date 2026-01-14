type EditorType = 'Lexical' | 'ProseMirror' | 'unknown';
type ProseMirrorType = 'Tiptap' | 'normal';

export function insertIntoInputBox(el: HTMLElement, regex: RegExp, prompt: string): void {
  if (el instanceof HTMLTextAreaElement) {
    insertIntoTextArea(el, regex, prompt);
  } else if (el instanceof HTMLDivElement) {
    insertIntoContentEditable(el, regex, prompt);
  }
}

export function focusAtPlaceholderAndClear(variable: string, el: HTMLElement): void {
  if (el instanceof HTMLTextAreaElement) {
    deleteAndFocusInTextArea(variable, el);
  } else if (el instanceof HTMLDivElement) {
    deleteAndFocusInContentEditable(variable, el);
  }
}

//* リッチテキストエディターのタイプを判定
function detectEditorType(el: HTMLDivElement): EditorType {
  if (
    el.getAttribute('data-lexical-editor') === 'true' ||
    !!el.closest('[data-lexical-editor="true"]') ||
    el.id === 'ask-input'
  ) {
    return 'Lexical';
  }

  if (
    (el.classList && el.classList.contains('ProseMirror')) ||
    (typeof el.closest === 'function' && !!el.closest('.ProseMirror'))
  ) {
    return 'ProseMirror';
  }

  return 'unknown';
}

//* ProseMirrorタイプを判定
function detectProseMirrorType(el: HTMLDivElement): ProseMirrorType {
  if ((el as any).__tiptapEditor || el.closest('.tiptap') || el.closest("[data-editor='tiptap']")) {
    return 'Tiptap';
  }
  return 'normal';
}

function insertIntoTextArea(el: HTMLTextAreaElement, regex: RegExp, prompt: string): void {
  const currentText = el.value;
  const newText = currentText.replace(regex, (match) => {
    const leadingSpace = match.startsWith(' ') ? ' ' : '';
    return leadingSpace + prompt;
  });
  el.value = newText;
  el.selectionStart = el.selectionEnd = newText.length;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertIntoContentEditable(inputBox: HTMLDivElement, regex: RegExp, prompt: string): void {
  const editorType = detectEditorType(inputBox);

  if (editorType === 'Lexical') {
    handleContentEditableInsert(inputBox, prompt);
  } else if (editorType === 'ProseMirror') {
    handleProseMirrorInsert(inputBox, regex, prompt);
  } else {
    handleGenericInsert(inputBox, prompt);
  }
}

//* ProseMirror エディタへの挿入
function handleProseMirrorInsert(inputBox: HTMLDivElement, regex: RegExp, prompt: string): void {
  const pmType = detectProseMirrorType(inputBox);

  if (pmType === 'normal') {
    insertFromInnerText(inputBox, regex, prompt);
  } else {
    handleContentEditableInsert(inputBox, prompt);
  }
}

//* ContentEditable共通挿入処理
function handleContentEditableInsert(inputBox: HTMLDivElement, prompt: string): void {
  const textToInsert = prompt + '  ';

  if (!tryExecCommandInsert(inputBox, textToInsert)) {
    fallbackInsert(inputBox, textToInsert);
  }

  moveCursorToEnd(inputBox);
  inputBox.dispatchEvent(new Event('change', { bubbles: true }));
}

//* innerTextからの挿入
function insertFromInnerText(inputBox: HTMLDivElement, regex: RegExp, prompt: string): void {
  try {
    const newText = inputBox.innerText.replace(regex, (match) => {
      const leadingSpace = match.startsWith(' ') ? ' ' : '';
      return leadingSpace + prompt;
    });
    inputBox.innerText = newText;
    moveCursorToEnd(inputBox);
    inputBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
  } catch (error) {
    console.warn('ProseMirror innerText insert failed:', error);
    handleContentEditableInsert(inputBox, prompt);
  }
}

//* execCommandによる挿入を試行
function tryExecCommandInsert(inputBox: HTMLDivElement, text: string): boolean {
  try {
    const selection = window.getSelection();
    if (!selection) return false;

    const range = document.createRange();
    range.selectNodeContents(inputBox);
    selection.removeAllRanges();
    selection.addRange(range);

    document.execCommand('delete', false, undefined);
    return document.execCommand('insertText', false, text);
  } catch (error) {
    console.warn('execCommand insert failed:', error);
    return false;
  }
}

//* フォールバック挿入処理
function fallbackInsert(inputBox: HTMLDivElement, text: string): void {
  try {
    inputBox.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: text,
        bubbles: true,
        cancelable: true,
      })
    );
    inputBox.dispatchEvent(new Event('input', { bubbles: true }));
  } catch (error) {
    inputBox.textContent = text;
    inputBox.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

//* 汎用的な挿入処理
function handleGenericInsert(inputBox: HTMLDivElement, prompt: string): void {
  const textToInsert = prompt + '  ';

  if (!tryExecCommandInsert(inputBox, textToInsert)) {
    inputBox.textContent = textToInsert;
    moveCursorToEnd(inputBox);
    inputBox.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

//* カーソルを末尾に移動
function moveCursorToEnd(el: HTMLDivElement): void {
  const selection = window.getSelection();
  if (!selection) return;

  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (error) {
    console.warn('Failed to move cursor:', error);
  }
}

function deleteAndFocusInTextArea(variable: string, el: HTMLTextAreaElement): void {
  const text = el.value;
  const index = text.lastIndexOf(variable);

  if (index === -1) return;

  const before = text.substring(0, index);
  const after = text.substring(index + variable.length);
  el.value = before + after;

  el.focus();
  el.setSelectionRange(index, index);

  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function deleteAndFocusInContentEditable(variable: string, el: HTMLDivElement): void {
  const selection = window.getSelection();
  if (!selection) return;

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent || '';
    const index = text.indexOf(variable);

    if (index !== -1) {
      try {
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + variable.length);

        range.deleteContents();
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
        el.focus();

        el.dispatchEvent(new InputEvent('input', { bubbles: true }));
      } catch (error) {
        console.error('Failed to delete and focus:', error);
      }
      break;
    }
  }
}
