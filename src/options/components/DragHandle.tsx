interface DragHandleProps {
  listeners?: React.HTMLAttributes<HTMLElement>;
  attributes?: React.HTMLAttributes<HTMLElement>;
}

const DragHandle: React.FC<DragHandleProps> = ({ listeners, attributes }) => (
  <div className="drag-handle" {...listeners} {...attributes}>
    <div className="drag-handle__dots">
      <span className="drag-handle__dot" />
      <span className="drag-handle__dot" />
    </div>
    <div className="drag-handle__dots">
      <span className="drag-handle__dot" />
      <span className="drag-handle__dot" />
    </div>
    <div className="drag-handle__dots">
      <span className="drag-handle__dot" />
      <span className="drag-handle__dot" />
    </div>
  </div>
);

export default DragHandle;