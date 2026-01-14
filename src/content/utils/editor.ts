type EditorType = 'Lexical' | 'ProseMirror' | 'unknown';
type ProseMirrorType = 'Tiptap' | 'normal';

//* 入力欄にテキストを挿入
export function insertIntoInputBox(el: HTMLElement, regex: RegExp, prompt: string): void {
  if (el instanceof HTMLTextAreaElement) {
    insertIntoTextArea(el, regex, prompt);
  } else if (el instanceof HTMLDivElement) {
    insertIntoContentEditable(el, regex, prompt);
  }
}

//* 変数1個用: 削除してフォーカス
export function focusAtPlaceholderAndClear(variable: string, el: HTMLElement): void {
  const position = deleteVariable(variable, el);
  if (position !== null) {
    focusAtPosition(el, position);
  }
}

//* モーダル用: 複数変数を一括置換
export function replaceVariables(replacements: Record<string, string>, el: HTMLElement): void {
  if (el instanceof HTMLTextAreaElement) {
    replaceVariablesInTextArea(replacements, el);
  } else if (el instanceof HTMLDivElement) {
    replaceVariablesInContentEditable(replacements, el);
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

//* ContentEditable共通挿入処理
function handleContentEditableInsert(inputBox: HTMLDivElement, prompt: string): void {
  const textToInsert = prompt + '  ';

  if (!tryExecCommandInsert(inputBox, textToInsert)) {
    fallbackInsert(inputBox, textToInsert);
  }

  moveCursorToEnd(inputBox);
  inputBox.dispatchEvent(new Event('change', { bubbles: true }));
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

//* 変数を削除して削除位置を返す
function deleteVariable(variable: string, el: HTMLElement): number | null {
  if (el instanceof HTMLTextAreaElement) {
    return deleteVariableInTextArea(variable, el);
  } else if (el instanceof HTMLDivElement) {
    return deleteVariableInContentEditable(variable, el);
  }
  return null;
}

//* textarea で変数を削除
function deleteVariableInTextArea(variable: string, el: HTMLTextAreaElement): number | null {
  const text = el.value;
  const index = text.lastIndexOf(variable);

  if (index === -1) return null;

  const before = text.substring(0, index);
  const after = text.substring(index + variable.length);
  el.value = before + after;

  el.dispatchEvent(new Event('input', { bubbles: true }));

  return index;
}

//* contenteditable で変数を削除
function deleteVariableInContentEditable(variable: string, el: HTMLDivElement): number | null {
  const selection = window.getSelection();
  if (!selection) return null;

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);

  let currentPos = 0;
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent || '';
    const index = text.lastIndexOf(variable);

    if (index !== -1) {
      try {
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + variable.length);

        range.deleteContents();

        el.dispatchEvent(new InputEvent('input', { bubbles: true }));

        return currentPos + index;
      } catch (error) {
        console.error('Failed to delete variable:', error);
        return null;
      }
    }

    currentPos += text.length;
  }

  return null;
}

//* 指定位置にフォーカス
function focusAtPosition(el: HTMLElement, position: number): void {
  if (el instanceof HTMLTextAreaElement) {
    el.focus();
    el.setSelectionRange(position, position);
  } else if (el instanceof HTMLDivElement) {
    focusAtPositionInContentEditable(el, position);
  }
}

function focusAtPositionInContentEditable(el: HTMLDivElement, position: number): void {
  const selection = window.getSelection();
  if (!selection) return;

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);

  let currentPos = 0;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const text = node.textContent || '';
    const nodeLength = text.length;

    if (currentPos + nodeLength >= position) {
      const offset = position - currentPos;
      const range = document.createRange();
      range.setStart(node, offset);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);
      el.focus();
      break;
    }

    currentPos += nodeLength;
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

function replaceVariablesInTextArea(replacements: Record<string, string>, el: HTMLTextAreaElement): void {
  let text = el.value;

  // 全ての変数を置換
  Object.entries(replacements).forEach(([variable, value]) => {
    const placeholder = `{{${variable}}}`;
    text = text.replaceAll(placeholder, value);
  });

  el.value = text;

  // 末尾にフォーカス
  el.focus();
  el.setSelectionRange(text.length, text.length);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function replaceVariablesInContentEditable(replacements: Record<string, string>, el: HTMLDivElement): void {
  let text = el.innerText;

  // 全ての変数を置換
  Object.entries(replacements).forEach(([variable, value]) => {
    const placeholder = `{{${variable}}}`;
    text = text.replaceAll(placeholder, value);
  });

  el.innerText = text;

  // 末尾にフォーカス
  moveCursorToEnd(el);
  el.dispatchEvent(new InputEvent('input', { bubbles: true }));
}
