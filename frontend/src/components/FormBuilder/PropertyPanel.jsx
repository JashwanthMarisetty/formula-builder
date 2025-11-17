import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { useForm } from '../../contexts/FormContext';

const PropertyPanel = ({ field, onUpdateField, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const { currentForm } = useForm();
  const allFields = (currentForm?.pages || []).flatMap(p => p.fields || []);

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

  // Conditional visibility rules handlers
  const rules = Array.isArray(field.visibilityRules) ? field.visibilityRules : [];
  const ops = [
    { value: 'eq', label: 'equals' },
    { value: 'neq', label: 'not equals' },
    { value: 'contains', label: 'contains' },
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'in', label: 'in list' },
  ];

  const updateRule = (index, next) => {
    const updated = [...rules];
    updated[index] = { ...(updated[index] || {}), ...next };
    onUpdateField({ visibilityRules: updated });
  };

  const updateRuleWhen = (ruleIndex, condIndex, next) => {
    const updated = [...rules];
    const whenArr = Array.isArray(updated[ruleIndex]?.when) ? updated[ruleIndex].when : [];
    whenArr[condIndex] = { ...(whenArr[condIndex] || { field: '', op: 'eq', value: '' }), ...next };
    updated[ruleIndex] = { ...(updated[ruleIndex] || {}), when: whenArr };
    onUpdateField({ visibilityRules: updated });
  };

  const addRule = () => {
    const updated = [...rules, { action: 'show', when: [{ field: '', op: 'eq', value: '' }] }];
    onUpdateField({ visibilityRules: updated });
  };

  const removeRule = (index) => {
    const updated = rules.filter((_, i) => i !== index);
    onUpdateField({ visibilityRules: updated });
  };

  const addRuleCondition = (ruleIndex) => {
    const updated = [...rules];
    const whenArr = Array.isArray(updated[ruleIndex]?.when) ? updated[ruleIndex].when : [];
    whenArr.push({ field: '', op: 'eq', value: '' });
    updated[ruleIndex] = { ...(updated[ruleIndex] || {}), when: whenArr };
    onUpdateField({ visibilityRules: updated });
  };

  const removeRuleCondition = (ruleIndex, condIndex) => {
    const updated = [...rules];
    const whenArr = Array.isArray(updated[ruleIndex]?.when) ? updated[ruleIndex].when : [];
    updated[ruleIndex] = { ...(updated[ruleIndex] || {}), when: whenArr.filter((_, i) => i !== condIndex) };
    onUpdateField({ visibilityRules: updated });
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

            {/* Conditional Visibility */}
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Conditional Visibility</label>
              <div className="space-y-3">
                {rules.length === 0 && (
                  <p className="text-xs text-gray-500">No rules added. This field is always visible.</p>
                )}
                {rules.map((rule, rIndex) => (
                  <div key={rIndex} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Rule {rIndex + 1}</span>
                      <button onClick={() => removeRule(rIndex)} className="text-red-500 text-xs">Remove</button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {(Array.isArray(rule.when) ? rule.when : []).map((cond, cIndex) => (
                        <div key={cIndex} className="grid grid-cols-3 gap-2 items-center">
                          <select
                            value={cond.field || ''}
                            onChange={(e) => updateRuleWhen(rIndex, cIndex, { field: e.target.value })}
                            className="px-2 py-1 border rounded"
                          >
                            <option value="">Select field</option>
                            {allFields.map((f) => (
                              <option key={f.id} value={f.id}>{f.label || f.id}</option>
                            ))}
                          </select>
                          <select
                            value={cond.op || 'eq'}
                            onChange={(e) => updateRuleWhen(rIndex, cIndex, { op: e.target.value })}
                            className="px-2 py-1 border rounded"
                          >
                            {ops.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                          </select>
                          <input
                            type="text"
                            value={cond.value ?? ''}
                            onChange={(e) => updateRuleWhen(rIndex, cIndex, { value: e.target.value })}
                            placeholder="value"
                            className="px-2 py-1 border rounded"
                          />
                          <div className="col-span-3 flex justify-end">
                            <button onClick={() => removeRuleCondition(rIndex, cIndex)} className="text-xs text-red-500">Remove condition</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <button onClick={() => addRuleCondition(rIndex)} className="text-xs text-gray-700">+ And condition</button>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">Action</span>
                        <select
                          value={rule.action || 'show'}
                          onChange={(e) => updateRule(rIndex, { action: e.target.value })}
                          className="px-2 py-1 border rounded"
                        >
                          <option value="show">Show</option>
                          <option value="hide">Hide</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addRule} className="w-full px-2 py-1 border border-dashed rounded text-xs text-gray-600 hover:bg-gray-50">+ Add visibility rule</button>
              </div>
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

            {/* Location Settings */}
            {field.type === 'location' && (
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-3">
                  Location Settings
                </label>
                <div className="space-y-4">
                  {/* Auto-fetch Location */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-fetch"
                      checked={field.locationSettings?.autoFetchLocation || false}
                      onChange={(e) => {
                        const newSettings = {
                          ...field.locationSettings,
                          autoFetchLocation: e.target.checked
                        };
                        handleInputChange('locationSettings', newSettings);
                      }}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="auto-fetch" className="text-xs lg:text-sm text-gray-700">
                      Auto-fetch user location
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 ml-5 -mt-2">
                    Automatically request user's current location when the form loads
                  </p>

                  {/* Allow Manual Pin Drop */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="manual-pin"
                      checked={field.locationSettings?.allowManualPin || false}
                      onChange={(e) => {
                        const newSettings = {
                          ...field.locationSettings,
                          allowManualPin: e.target.checked
                        };
                        handleInputChange('locationSettings', newSettings);
                      }}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="manual-pin" className="text-xs lg:text-sm text-gray-700">
                      Allow manual pin drop
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 ml-5 -mt-2">
                    Let users click on the map to select a different location
                  </p>

                  {/* Default Zoom Level */}
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                      Default Zoom Level
                    </label>
                    <select
                      value={field.locationSettings?.defaultZoom || 10}
                      onChange={(e) => {
                        const newSettings = {
                          ...field.locationSettings,
                          defaultZoom: parseInt(e.target.value)
                        };
                        handleInputChange('locationSettings', newSettings);
                      }}
                      className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs lg:text-sm"
                    >
                      <option value={5}>City Level (5)</option>
                      <option value={10}>District Level (10)</option>
                      <option value={15}>Neighborhood (15)</option>
                      <option value={18}>Street Level (18)</option>
                    </select>
                  </div>

                  {/* Help Text for Location */}
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                      Help Text
                    </label>
                    <textarea
                      value={field.locationHelpText || ''}
                      onChange={(e) => handleInputChange('locationHelpText', e.target.value)}
                      rows={2}
                      className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-xs lg:text-sm"
                      placeholder="e.g., Please select your current location or the location where you want the service"
                    />
                  </div>
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

      </div>
    </div>
  );
};

export default PropertyPanel;