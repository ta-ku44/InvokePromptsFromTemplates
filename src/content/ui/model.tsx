import React, { useActionState, useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.scss';

let rootEl: HTMLElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

export async function showModal(
  variables: string[],
  onSubmit: (replacements: Record<string, string>) => void
): Promise<void> {
  rootEl = Object.assign(document.createElement('div'), {
    id: 'pl-modal-root',
    style: `position:absolute;
            z-index:${Number.MAX_SAFE_INTEGER};
            visibility:hidden;`,
  });

  document.body.appendChild(rootEl);
  root = createRoot(rootEl);

  root.render(
    <VariableModal
      variables={variables}
      onOpen={() => {
        rootEl!.style.visibility = 'visible';
      }}
      onSubmit={(replacements) => {
        onSubmit(replacements);
        closeModal();
      }}
      onClose={() => {
        closeModal();
      }}
    />
  );

  console.log('show modal with variables:', variables);
}

function closeModal(): void {
  root?.unmount();
  root = null;
  rootEl?.remove();
  rootEl = null;

  console.log('modal closed');
}

interface ModalProps {
  onOpen: () => void;
  onClose: () => void;
  onSubmit: (replacements: Record<string, string>) => void;
  variables: string[];
}

export const VariableModal: React.FC<ModalProps> = ({ onOpen, onClose, onSubmit, variables }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [state, formAction, isPending] = useActionState(
    async (_: any, formData: FormData) => {
      const replacements: Record<string, string> = {};
      variables.forEach((variable) => {
        const value = formData.get(variable) as string;
        if (!value?.trim()) {
          return {
            success: false,
            error: `${variable} を入力してください`,
          };
        }
        replacements[variable] = value;
      });
      onSubmit(replacements);
      return { success: true, error: null };
    },
    { success: false, error: null }
  );

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    onOpen();
    return () => onClose();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <h3>変数を入力</h3>
        <form action={formAction}>
          {variables.map((variable, idx) => (
            <div key={variable} className="form-group">
              <label htmlFor={variable}>{variable.charAt(0).toUpperCase() + variable.slice(1)}</label>
              <input
                ref={idx === 0 ? firstInputRef : null}
                id={variable}
                name={variable}
                type="text"
                value={values[variable] || ''}
                onChange={(e) => setValues({ ...values, [variable]: e.target.value })}
                disabled={isPending}
              />
            </div>
          ))}
          {state.error && <div className="error-message">{state.error}</div>}
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isPending}>
              キャンセル
            </button>
            <button type="submit" disabled={isPending}>
              {isPending ? '送信中...' : '挿入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
