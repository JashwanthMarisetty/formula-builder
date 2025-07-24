import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Trash2, Edit, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { AUTO_SAVE_DELAY } from '../../constants';
import FormField from './FormField';

const FormCanvas = ({ 
  form, 
  currentPageId, 
  onUpdateField, 
  onRemoveField, 
  onSelectField,
  selectedFieldId,
  onReorderFields,
  onSaveForm,
  onAddField
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [lastSaved, setLastSaved] = useState(Date.now());
  const autoSaveInterval = useRef(null);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
    }

    autoSaveInterval.current = setInterval(() => {
      if (form && Date.now() - lastSaved > 30000) { // Auto-save every 30 seconds
        onSaveForm();
        setLastSaved(Date.now());
      }
    }, AUTO_SAVE_DELAY);

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [form, lastSaved, onSaveForm]);

  const currentPage = form?.pages?.find(page => page.id === currentPageId);
  const fields = currentPage?.fields || [];

  const handleDragEnd = (result) => {
    setIsDragging(false);
    
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex !== destIndex) {
      onReorderFields(sourceIndex, destIndex);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleFieldClick = (fieldId) => {
    onSelectField(fieldId);
  };

  const handleDuplicateField = (field) => {
    const duplicatedField = {
      ...field,
      id: Date.now().toString(),
      label: `${field.label} (Copy)`
    };
    if (onAddField) {
      onAddField(duplicatedField);
    }
  };

  if (!form) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No form selected</p>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Edit className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Add your first field</h3>
          <p className="text-gray-500">Select a field type from the palette to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 p-2 sm:p-4 lg:p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        {/* Form Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">{form.name}</h1>
          {form.description && (
            <p className="text-sm sm:text-base text-gray-600">{form.description}</p>
          )}
        </div>

        {/* Form Fields */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
            <Droppable droppableId="form-fields">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-4 ${
                    snapshot.isDraggingOver ? 'bg-purple-50' : ''
                  } ${isDragging ? 'min-h-[200px]' : ''}`}
                >
                  {fields.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative group ${
                            snapshot.isDragging ? 'z-50' : ''
                          } ${
                            selectedFieldId === field.id 
                              ? 'ring-2 ring-purple-500' 
                              : ''
                          } transition-all duration-200`}
                          onClick={() => handleFieldClick(field.id)}
                        >
                          {/* Field Actions */}
                          <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                            <div className="flex space-x-1 bg-white rounded-lg shadow-lg p-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateField(field);
                                }}
                                className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-all duration-200 hover:scale-110"
                                title="Duplicate field"
                              >
                                <Copy className="w-2 h-2 sm:w-3 sm:h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectField(field.id);
                                }}
                                className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-all duration-200 hover:scale-110"
                                title="Edit field"
                              >
                                <Edit className="w-2 h-2 sm:w-3 sm:h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveField(field.id);
                                }}
                                className="w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 hover:scale-110"
                                title="Delete field"
                              >
                                <Trash2 className="w-2 h-2 sm:w-3 sm:h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move bg-white rounded p-1 shadow-md"
                          >
                            <div className="flex flex-col space-y-1">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            </div>
                          </div>

                          {/* Field Component */}
                          <div className="pl-4 sm:pl-6">
                            <FormField
                              field={field}
                              isSelected={selectedFieldId === field.id}
                              onUpdate={onUpdateField}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
};

export default FormCanvas;