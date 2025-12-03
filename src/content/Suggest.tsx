import React, { useEffect, useRef, useMemo } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import './styles.css';
import { loadStoredData, } from '../utils/storage';
import type { Template,Group } from '../types/index';
import { handleTemplateSelect } from './index.tsx';

let root : Root | null = null;
let container : HTMLElement | null = null;

//** サジェストを表示 */
const viewSuggest =  async (query: string, textArea: HTMLElement | null) => {
  if (!textArea) return;

  // プロンプトのテンプレートを取得
  const data = await loadStoredData();
  const templates = data.templates.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.content.toLowerCase().includes(query.toLowerCase())
  );

  if (templates.length === 0) {
    console.log('該当するテンプレートが存在しない');
    hideSuggest();
    return;
  }

  console.log('該当するテンプレートを取得:', templates);

  // サジェストの位置を計算
  const rect = textArea.getBoundingClientRect();
  const suggestHeight = Math.min(templates.length * 40 + 50, 300);
  const viewportHeight = window.innerHeight;

  // 画面下に収まるかチェック
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;
  const showAbove = spaceBelow < suggestHeight && spaceAbove > spaceBelow;

  // 上に表示する場合は入力欄の上端から、下に表示する場合は入力欄の下端から
  const gap = 12; // 入力欄との間隔
  const position = {
    top: showAbove 
      ? rect.top + window.scrollY - suggestHeight - gap
      : rect.bottom + window.scrollY + gap,
    left: rect.left + window.scrollX,
  };
  console.log('サジェストの位置:', position, showAbove ? '(上に表示)' : '(下に表示)');

  // 既存のコンテナが存在しなければコンテナを作成
  if (!container) {
    container = document.createElement('div');
    container.id = 'pt-suggest-root';
    container.style.position = 'absolute';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    root = createRoot(container);
  }
  console.log('サジェストコンテナを作成または取得:', container);

  container.style.top = `${position.top}px`;
  container.style.left = `${position.left}px`;
  container.style.width = `${rect.width}px`;
  console.log('サジェストコンテナの位置を設定:', container.style.top, container.style.left);

  root?.render(
    <Suggest 
      templates={templates}
      groups={data.groups}
      onSelect={(template) => {
        handleTemplateSelect(template);
        hideSuggest();
      }}
      onClose={() => { hideSuggest(); }}
    />
  );
  console.log('サジェストを表示しました');
}

//** サジェストを非表示 */
const hideSuggest = () => {
  if (root) {
    root.unmount();
    root = null;
  }
  if (container) {
    container.remove();
    container = null;
  }

  console.log('サジェストを非表示にしました');
}

interface SuggestProps {
  templates: Template[];
  groups: Group[];
  onSelect: (template: Template) => void;
  onClose: () => void;
}

const Suggest: React.FC<SuggestProps> = ({ templates, groups, onSelect, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    // mousedownを使用してフォーカスが外れる前に検知
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // グループIDに基づいてデータを整形
  const groupedData = useMemo(() => {
    const groupMap = new Map<number, { group: Group, items: Template[] }>();
    
    // グループを初期化
    groups.forEach(g => {
      groupMap.set(g.id, { group: g, items: [] });
    });

    // グループなし用の箱
    const noGroupItems: Template[] = [];

    // テンプレートを振り分け
    templates.forEach(t => {
      if (groupMap.has(t.groupId)) {
        groupMap.get(t.groupId)?.items.push(t);
      } else {
        noGroupItems.push(t);
      }
    });

    // 表示用の配列に変換 (空のグループは除外するか、要件に応じて調整)
    const result = Array.from(groupMap.values())
      .filter(entry => entry.items.length > 0)
      .map(entry => ({
        title: entry.group.name,
        items: entry.items
      }));

    // グループなしのアイテムがあれば "Others" または ヘッダーなしで追加
    if (noGroupItems.length > 0) {
      result.push({
        title: 'Others', // または空文字
        items: noGroupItems
      });
    }

    return result;
  }, [templates, groups]);

  return (
    // CSSクラス 'suggestion-container' を適用
    <div className="pt-suggestion-container" ref={containerRef}>
      <div className='pt-suggestion-scroll-area'>
        
        {groupedData.map((section, idx) => (
          <div key={idx}>
            {/* セクションヘッダー */}
            {section.title && (
              <div className="section-header">{section.title}</div>
            )}
            
            {/* リストアイテム */}
            {section.items.map((item) => (
              <div 
                key={item.id} 
                className="list-item"
                onClick={() => onSelect(item)}
              >
                {/* ここではテンプレート名を表示。必要に応じて content のプレビューなども追加可 */}
                {item.name}
              </div>
            ))}
          </div>
        ))}
        
        {groupedData.length === 0 && (
          <div style={{ padding: '10px', color: '#999', fontSize: '12px' }}>
            No templates found.
          </div>
        )}
      </div>
    </div>
  );
};

export { viewSuggest, hideSuggest };