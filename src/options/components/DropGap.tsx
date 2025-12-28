import React from "react";
import { useDroppable } from '@dnd-kit/core';

interface DropGapProps {
  type: 'template' | 'group';
  indexOrId: number;
  groupId?: number;
  isDraggingGroup?: boolean;
  isActive: boolean;
  disabled?: boolean;
}

const DropGap: React.FC<DropGapProps> = ({
  type,
  indexOrId,
  groupId,
  isDraggingGroup = false,
  isActive,
  disabled = false,
}) => {
  const id = type === 'template' 
    ? `gap-${groupId}-${indexOrId}`
    : `group-gap-${indexOrId}`;

  const isDisabled = (type === 'group' && !isDraggingGroup) || disabled;

  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: `${type}-gap`, 
      groupId: type === 'template' ? groupId : undefined, 
      indexOrId 
    },
    disabled: isDisabled,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`drop-gap drop-gap--${type} ${isActive ? 'drop-gap--active' : ''}`}
    />
  );
};

export default DropGap;