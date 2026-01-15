type EditorType = 'Lexical' | 'ProseMirror' | 'unknown';
type ProseMirrorType = 'Tiptap' | 'normal';

interface EditorInfo {
  type: EditorType;
  pmType: ProseMirrorType | null;
}

export function insertIntoInputBox(el: HTMLElement, regex: RegExp, prompt: string): void {
  if (el instanceof HTMLTextAreaElement) {
    insertIntoTextArea(el, regex, prompt);
  } else if (el instanceof HTMLDivElement) {
    insertIntoContentEditable(el, regex, prompt);
  }
}

export function replaceVariables(replacements: Record<string, string>, el: HTMLElement): void {
  if (el instanceof HTMLTextAreaElement) {
    replaceInTextArea(replacements, el);
  } else if (el instanceof HTMLDivElement) {
    replaceInContentEditable(replacements, el);
  }
}

function getEditorInfo(el: HTMLDivElement): EditorInfo {
  const type = detectEditorType(el);
  const pmType = type === 'ProseMirror' ? detectProseMirrorType(el) : null;
  return { type, pmType };
}

function detectEditorType(el: HTMLDivElement): EditorType {
  if (
    el.getAttribute('data-lexical-editor') === 'true' ||
    !!el.closest('[data-lexical-editor="true"]') ||
    el.id === 'ask-input'
  ) {
    return 'Lexical';
  }

  if (el.classList?.contains('ProseMirror') || el.closest('.ProseMirror')) {
    return 'ProseMirror';
  }

  return 'unknown';
}

function detectProseMirrorType(el: HTMLDivElement): ProseMirrorType {
  if ((el as any).__tiptapEditor || el.closest('.tiptap') || el.closest("[data-editor='tiptap']")) {
    return 'Tiptap';
  }
  return 'normal';
}

function insertIntoTextArea(el: HTMLTextAreaElement, regex: RegExp, prompt: string): void {
  const newText = el.value.replace(regex, (match) => {
    const leadingSpace = match.startsWith(' ') ? ' ' : '';
    return leadingSpace + prompt;
  });

  el.value = newText;
  el.selectionStart = el.selectionEnd = newText.length;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function replaceInTextArea(replacements: Record<string, string>, el: HTMLTextAreaElement): void {
  const text = applyReplacements(el.value, replacements);

  el.value = text;
  el.focus();
  el.setSelectionRange(text.length, text.length);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertIntoContentEditable(el: HTMLDivElement, regex: RegExp, prompt: string): void {
  const { type, pmType } = getEditorInfo(el);

  if (type === 'Lexical') {
    execCommandInsert(el, prompt);
  } else if (type === 'ProseMirror' && pmType === 'normal') {
    insertViaInnerText(el, regex, prompt);
  } else if (type === 'ProseMirror' && pmType === 'Tiptap') {
    execCommandInsert(el, prompt);
  } else {
    insertGeneric(el, prompt);
  }
}

function replaceInContentEditable(replacements: Record<string, string>, el: HTMLDivElement): void {
  const { type, pmType } = getEditorInfo(el);

  if (type === 'ProseMirror' && pmType === 'normal') {
    const text = applyReplacements(el.innerText, replacements);
    el.innerText = text;
  } else {
    const html = applyReplacementsToHtml(el.innerHTML, replacements);
    el.innerHTML = html;
  }

  moveCursorToEnd(el);
  el.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

function insertViaInnerText(el: HTMLDivElement, regex: RegExp, prompt: string): void {
  try {
    const newText = el.innerText.replace(regex, (match) => {
      const leadingSpace = match.startsWith(' ') ? ' ' : '';
      return leadingSpace + prompt;
    });

    el.innerText = newText;
    moveCursorToEnd(el);
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
  } catch (error) {
    console.warn('innerText insert failed:', error);
    execCommandInsert(el, prompt);
  }
}

function execCommandInsert(el: HTMLDivElement, prompt: string): void {
  const text = prompt + '  ';

  if (!tryExecCommandInsert(el, text)) {
    fallbackInsert(el, text);
  }

  moveCursorToEnd(el);
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function insertGeneric(el: HTMLDivElement, prompt: string): void {
  const text = prompt + '  ';

  if (!tryExecCommandInsert(el, text)) {
    el.textContent = text;
    moveCursorToEnd(el);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function tryExecCommandInsert(el: HTMLDivElement, text: string): boolean {
  try {
    const selection = window.getSelection();
    if (!selection) return false;

    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);

    document.execCommand('delete', false, undefined);
    return document.execCommand('insertText', false, text);
  } catch (error) {
    console.warn('execCommand insert failed:', error);
    return false;
  }
}

function fallbackInsert(el: HTMLDivElement, text: string): void {
  try {
    el.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: text,
        bubbles: true,
        cancelable: true,
      })
    );
    el.dispatchEvent(new Event('input', { bubbles: true }));
  } catch (error) {
    el.textContent = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function applyReplacements(text: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce((result, [variable, value]) => {
    const placeholder = `{{${variable}}}`;
    return result.replaceAll(placeholder, value);
  }, text);
}

function applyReplacementsToHtml(html: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce((result, [variable, value]) => {
    const placeholder = `{{${variable}}}`;
    const escapedValue = escapeHtml(value);
    return result.replaceAll(placeholder, escapedValue);
  }, html);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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
