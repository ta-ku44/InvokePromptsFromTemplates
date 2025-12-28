import React from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import Icons from './assets/icons.ts';
import type { Template } from '../types/index';
import TemplateModal from './components/EntryEditor.tsx';
import GroupItem from './components/GroupPanel.tsx';
import DragHandle from './components/DragHandle.tsx';
import DropGap from './components/DropGap.tsx';
import { useGroupsAndTemplates } from './hooks/useGroupsAndTemplates';
import { useUIState } from './hooks/useUIState';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import './styles.scss';

const Options: React.FC = () => {
  const {
    groups,
    templates,
    setGroups,
    setTemplates,
    addGroup,
    deleteGroup,
    updateGroupName,
    reorderGroups,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    moveTemplateToGroup,
    reorderTemplates,
    getTemplatesForGroup,
  } = useGroupsAndTemplates();

  const {
    expandedGroups,
    setExpandedGroups,
    editingTemplate,
    addingToGroupId,
    isModalOpen,
    editingGroupId,
    toggleGroup,
    openAddTemplateModal,
    openEditTemplateModal,
    closeModal,
    startEditingGroup,
    finishEditingGroup,
  } = useUIState(groups.map(g => g.id));

  const {
    sensors,
    activeTemplateId,
    activeTemplateGapId,
    activeGroupId,
    activeGroupGapId,
    activeTemplate,
    activeGroup,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useDragAndDrop({
    groups,
    templates,
    expandedGroups,
    setExpandedGroups,
    setGroups,
    setTemplates,
    reorderGroups,
    moveTemplateToGroup,
    reorderTemplates,
  });

  const handleAddGroup = async () => {
    const newGroupId = await addGroup();
    startEditingGroup(newGroupId);
  };

  const handleSaveTemplate = async (
    templateData: Partial<Template> & { groupId: number }
  ) => {
    if (templateData.id) {
      await updateTemplate(templateData.id, {
        name: templateData.name,
        content: templateData.content,
      });
    } else {
      await addTemplate({
        groupId: templateData.groupId,
        name: templateData.name || '',
        content: templateData.content || '',
      });
    }
    closeModal();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="options-container">
        <header className="options-header">
          <h1>Invoke Prompts from Templates</h1>
        </header>

        <div className="group-area">
          <div className="group-area__header">
            <button className="button button--add-group" onClick={handleAddGroup}>
              <Icons.PlaylistAdd />
              グループを追加
            </button>
          </div>
          {groups.length === 0 ? (
            <div className="empty-state">
              <p>まだグループがありません</p>
              <p>「追加」ボタンをクリックして開始しましょう</p>
            </div>
          ) : (
            <div className="group-area__list">
              {groups.map((group, idx) => (
                <React.Fragment key={group.id}>
                  <DropGap
                    type="group"
                    indexOrId={idx}
                    isActive={activeGroupGapId === `group-gap-${idx}`}
                    isDraggingGroup={activeGroupId !== null}
                  />
                  
                  <GroupItem
                    group={group}
                    templates={getTemplatesForGroup(group.id)}
                    isExpanded={expandedGroups.has(group.id)}
                    onToggle={() => toggleGroup(group.id)}
                    onEdit={openEditTemplateModal}
                    onDeleteTemplate={deleteTemplate}
                    onTemplateNameChange={(id, name) => updateTemplate(id, { name })}
                    onGroupNameChange={updateGroupName}
                    onDeleteGroup={deleteGroup}
                    onAddTemplate={openAddTemplateModal}
                    startEditing={editingGroupId === group.id}
                    onEditingComplete={finishEditingGroup}
                    activeTemplateId={activeTemplateId}
                    activeGapId={activeTemplateGapId}
                    groupDraggableId={`group-${group.id}`}
                    isGroupDragging={activeGroupId === group.id}
                    isAnyGroupDragging={activeGroupId !== null}
                  />
                </React.Fragment>
              ))}
              <DropGap
                type="group"
                indexOrId={groups.length}
                isActive={activeGroupGapId === `group-gap-${groups.length}`}
                isDraggingGroup={activeGroupId !== null}
              />
            </div>
          )}
        </div>

        {isModalOpen && (
          <TemplateModal
            template={editingTemplate}
            groupId={addingToGroupId}
            onSave={handleSaveTemplate}
            onClose={closeModal}
          />
        )}

        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
          {activeTemplate && (
            <div className="template template--drag-overlay">
              <DragHandle />
              <span className="template__name">{activeTemplate.name}</span>
              <div className="template__actions">
                <button className="button button--icon">
                  <Icons.Edit />
                </button>
                <button className="button button--icon button--icon--delete">
                  <Icons.Delete />
                </button>
              </div>
            </div>
          )}

          {activeGroup && (
            <div className="group group--drag-overlay">
              <div className="group__header">
                <button className="button button--expand">
                  <Icons.ExpandMore />
                </button>
                <span className="group__name">{activeGroup.name}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default Options;