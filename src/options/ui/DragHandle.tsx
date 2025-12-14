interface DragHandleProps {
  listeners?: React.HTMLAttributes<HTMLElement>;
  attributes?: React.HTMLAttributes<HTMLElement>;
}

const DragHandle: React.FC<DragHandleProps> = ({ listeners, attributes }) => (
  <div className="drag-handle" {...listeners} {...attributes}>
    <div className="drag-handle-dots">
      <span className="drag-handle-dot" />
      <span className="drag-handle-dot" />
    </div>
    <div className="drag-handle-dots">
      <span className="drag-handle-dot" />
      <span className="drag-handle-dot" />
    </div>
    <div className="drag-handle-dots">
      <span className="drag-handle-dot" />
      <span className="drag-handle-dot" />
    </div>
  </div>
);

export default DragHandle;