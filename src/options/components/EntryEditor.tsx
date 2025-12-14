import React, { useState } from 'react';
import { type Template } from '../../types/index.ts';

interface TemplateModalProps {
  template: Template | null;
  groupId: number | null;
  onSave: (template: Partial<Template> & { groupId: number }) => void;
  onClose: () => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  template,
  groupId,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(template?.name || '');
  const [content, setContent] = useState(template?.content || '');
  const [showError, setShowError] = useState(false);

  const isNameEmpty = !name.trim();

  const handleSave = () => {
    if (isNameEmpty) {
      setShowError(true);
      return;
    }
    onSave({
      id: template?.id,
      groupId: template?.groupId ?? groupId!,
      name: name.trim(),
      content: content,
    });
  };

  return (
    <div 
      className="modal-overlay" 
      onMouseDown={(e) => {
        // オーバーレイ自体がクリックされた場合のみ閉じる
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{template ? 'テンプレートを編集' : '新しいテンプレート'}</h2>
        <div className={`modal-field ${showError && isNameEmpty ? 'error' : ''}`}>
          <label>
            テンプレート名
            <span className="required-mark">*必須</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (showError) setShowError(false);
            }}
            placeholder="テンプレート名を入力"
          />
          {showError && isNameEmpty && (
            <span className="error-message">テンプレート名は必須です</span>
          )}
        </div>
        <div className="modal-field">
          <label>内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="プロンプトの内容を入力"
          />
        </div>
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>
            キャンセル
          </button>
          <button 
            className={`modal-btn save ${isNameEmpty ? 'disabled' : ''}`}
            onClick={handleSave}
            disabled={isNameEmpty}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;