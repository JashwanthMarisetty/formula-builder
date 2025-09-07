import React, { useState, useRef, useEffect } from 'react';
import { X, Settings, CheckCircle, AlertCircle } from 'lucide-react';

const PropertyPanel = ({ field, onUpdateField, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');

  if (!field) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="text-center text-gray-500 mt-20">
          <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Select a field to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (property, value) => {
    onUpdateField({ [property]: value });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...(field.options || [])];
    newOptions[index] = value;
    onUpdateField({ options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(field.options || []), `Option ${(field.options || []).length + 1}`];
    onUpdateField({ options: newOptions });
  };

  const removeOption = (index) => {
    const newOptions = (field.options || []).filter((_, i) => i !== index);
    onUpdateField({ options: newOptions });
  };

  const handleSubfieldChange = (index, property, value) => {
    const newSubfields = [...(field.subfields || [])];
    newSubfields[index] = { ...newSubfields[index], [property]: value };
    onUpdateField({ subfields: newSubfields });
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings }
  ];

  return (
    <div className="w-full lg:w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900">Field Properties</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-1 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-3 h-3 lg:w-4 lg:h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Field Label */}
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                Field Label
              </label>
              <input
                type="text"
                value={field.label || ''}
                onChange={(e) => handleInputChange('label', e.target.value)}
                className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs lg:text-sm"
                autoFocus
              />
            </div>

            {/* Field Description */}
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                Description
              </label>
              <textarea
                value={field.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-xs lg:text-sm"
                placeholder="Help text for this field"
              />
            </div>

            {/* Placeholder */}
            {['text', 'email', 'phone', 'number', 'textarea'].includes(field.type) && (
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={field.placeholder || ''}
                  onChange={(e) => handleInputChange('placeholder', e.target.value)}
                  className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs lg:text-sm"
                />
              </div>
            )}

            {/* Options */}
            {['select', 'radio', 'checkbox'].includes(field.type) && (
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                  Options
                </label>
                <div className="space-y-2">
                  {(field.options || []).map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="flex-1 px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs lg:text-sm"
                      />
                      <button
                        onClick={() => removeOption(index)}
                        className="w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addOption}
                    className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors text-xs lg:text-sm"
                  >
                    Add Option
                  </button>
                </div>
              </div>
            )}

            {/* Address Subfields */}
            {field.type === 'address' && (
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                  Address Fields
                </label>
                <div className="space-y-3">
                  {(field.subfields || []).map((subfield, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <input
                          type="text"
                          value={subfield.label}
                          onChange={(e) => handleSubfieldChange(index, 'label', e.target.value)}
                          className="font-medium text-xs lg:text-sm bg-transparent border-none p-0 focus:ring-0"
                        />
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={subfield.required}
                            onChange={(e) => handleSubfieldChange(index, 'required', e.target.checked)}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-xs lg:text-xs text-gray-500">Required</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required Field */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="required"
                checked={field.required || false}
                onChange={(e) => handleInputChange('required', e.target.checked)}
                className="text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="required" className="text-xs lg:text-sm font-medium text-gray-700">
                Required field
              </label>
            </div>
          </div>
        )}

        {activeTab === 'validation' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600" />
              <h3 className="font-medium text-gray-900 text-sm lg:text-base">Field Validation</h3>
            </div>

            {/* Min/Max Length for text fields */}
            {['text', 'textarea', 'email'].includes(field.type) && (
              <>
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                    Minimum Length
                  </label>
                  <input
                    type="number"
                    value={field.validation?.minLength || ''}
                    onChange={(e) => handleInputChange('validation', { 
                      ...field.validation, 
                      minLength: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs lg:text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                    Maximum Length
                  </label>
                  <input
                    type="number"
                    value={field.validation?.maxLength || ''}
                    onChange={(e) => handleInputChange('validation', { 
                      ...field.validation, 
                      maxLength: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs lg:text-sm"
                    min="0"
                  />
                </div>
              </>
            )}

            {/* Min/Max Value for number fields */}
            {field.type === 'number' && (
              <>
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                    Minimum Value
                  </label>
                  <input
                    type="number"
                    value={field.validation?.min || ''}
                    onChange={(e) => handleInputChange('validation', { 
                      ...field.validation, 
                      min: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs lg:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                    Maximum Value
                  </label>
                  <input
                    type="number"
                    value={field.validation?.max || ''}
                    onChange={(e) => handleInputChange('validation', { 
                      ...field.validation, 
                      max: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs lg:text-sm"
                  />
                </div>
              </>
            )}

            {/* Custom Error Message */}
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                Custom Error Message
              </label>
              <input
                type="text"
                value={field.validation?.errorMessage || ''}
                onChange={(e) => handleInputChange('validation', { 
                  ...field.validation, 
                  errorMessage: e.target.value 
                })}
                className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs lg:text-sm"
                placeholder="This field is required"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyPanel;