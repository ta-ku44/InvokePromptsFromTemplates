import React from 'react';
import { saveTemplates } from '../utils/storage';
import type { Template } from '../types';

const Popup: React.FC = () => {
  const addDebugTemplates = async () => {
    const debugTemplates: Template[] = [
      {
        id: '1',
        name: 'summary',
        content: '以下の内容を簡潔に要約してください:\n\n'
      },
      {
        id: '2',
        name: 'explain',
        content: '以下について詳しく説明してください:\n\n'
      },
      {
        id: '3',
        name: 'translate',
        content: '以下を日本語に翻訳してください:\n\n'
      },
      {
        id: '4',
        name: 'code',
        content: '以下のコードを解説してください:\n\n```\n\n```'
      }
    ];

    await saveTemplates(debugTemplates);
    alert('デバッグ用テンプレートを追加しました！');
  };

  return (
    <div style={{ width: '300px', padding: '20px' }}>
      <h2>PromptTemplate</h2>
      <p>拡張機能が動作しています</p>
      
      <button 
        onClick={addDebugTemplates}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        デバッグ用テンプレートを追加
      </button>
    </div>
  );
};

export default Popup;