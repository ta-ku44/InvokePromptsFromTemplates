import React, { useEffect, useState } from 'react';
import type { Template } from '../types';

interface TemplateDropdownProps {
  templates: Template[];
  query: string;
  position: { top: number; left: number };
  onSelect: (template: Template) => void;
  onClose: () => void;
}

const TemplateDropdown: React.FC<TemplateDropdownProps> = ({
  templates,
  query,
  position,
  onSelect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(query.toLowerCase())
  );

  // キーボード操作のハンドリング
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredTemplates.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredTemplates[selectedIndex]) {
          onSelect(filteredTemplates[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredTemplates, onSelect, onClose]);
  if (filteredTemplates.length === 0) {
    return (
      <div
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 10000,
          minWidth: '200px',
        }}
      >
        <div style={{ color: '#999' }}>テンプレートが見つかりません</div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 10000,
        minWidth: '250px',
        maxHeight: '300px',
        overflowY: 'auto',
      }}
    >
      {filteredTemplates.map((template, index) => (
        <div
          key={template.id}
          onClick={() => onSelect(template)}
          style={{
            padding: '10px 15px',
            cursor: 'pointer',
            backgroundColor: index === selectedIndex ? '#e8f0fe' : 'white',
            borderBottom: index < filteredTemplates.length - 1 ? '1px solid #eee' : 'none',
          }}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {template.name}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#666',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {template.content}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TemplateDropdown;