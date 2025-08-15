import React, { useState } from 'react';
import { CONDITION_STATES, getConditionStatesForFieldType } from '../../constants';
import { supportsConditionalLogic, validateCondition } from '../../utils/conditionalLogic';
import { ChevronDown, ChevronUp, Trash2, Eye, EyeOff, SkipForward, Plus, X, AlertTriangle } from 'lucide-react';

const ConditionalRuleBlock = ({ 
  rule, 
  allFields, 
  allPages, 
  onUpdateRule, 
  onRemoveRule, 
  type,
  index 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleFieldChange = (field, value) => {
    onUpdateRule(rule.id, { [field]: value });
  };

  const addConditionGroup = () => {
    const newConditions = rule.conditions || [
      {
        triggerFieldId: rule.triggerFieldId,
        state: rule.state,
        value: rule.value,
        operator: 'AND'
      }
    ];
    
    newConditions.push({
      triggerFieldId: '',
      state: 'is equal to',
      value: '',
      operator: 'AND'
    });

    onUpdateRule(rule.id, { conditions: newConditions });
  };

  const updateCondition = (conditionIndex, field, value) => {
    const newConditions = [...(rule.conditions || [])];
    newConditions[conditionIndex] = {
      ...newConditions[conditionIndex],
      [field]: value
    };
    onUpdateRule(rule.id, { conditions: newConditions });
  };

  const removeCondition = (conditionIndex) => {
    const newConditions = [...(rule.conditions || [])];
    newConditions.splice(conditionIndex, 1);
    onUpdateRule(rule.id, { conditions: newConditions });
  };

  const getTriggerField = (fieldId) => {
    return allFields.find(f => f.id === fieldId);
  };

  const renderValueInput = (fieldId, value, onChange) => {
    const triggerField = getTriggerField(fieldId);
    
    if (!triggerField) {
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
          placeholder="Enter value"
        />
      );
    }

    // Dynamic input based on trigger field type
    switch (triggerField.type) {
      case 'select':
      case 'radio':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
          >
            <option value="">Select option</option>
            {triggerField.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
          >
            <option value="">Select option</option>
            {triggerField.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
            placeholder="Enter number"
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
            placeholder="Enter value"
          />
        );
    }
  };

  const getActionIcon = () => {
    if (type === 'field') {
      return rule.action === 'show' ? <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />;
    } else {
      return <SkipForward className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  const getActionColor = () => {
    if (type === 'field') {
      return rule.action === 'show' ? 'text-green-600' : 'text-orange-600';
    } else {
      return 'text-blue-600';
    }
  };

  const hasGroupedConditions = rule.conditions && rule.conditions.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
      {/* Rule Header */}
      <div className="p-3 sm:p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${getActionColor()} bg-gray-50`}>
              {getActionIcon()}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                Rule #{index + 1} {hasGroupedConditions && '(Grouped)'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {type === 'field' ? 'Field Condition' : 'Page Condition'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!hasGroupedConditions && (
              <button
                onClick={addConditionGroup}
                className="text-purple-600 hover:text-purple-700 transition-colors"
                title="Add grouped condition"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
            <button
              onClick={() => onRemoveRule(rule.id)}
              className="text-red-500 hover:text-red-700 transition-colors"
              title="Delete rule"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Rule Content */}
      {isExpanded && (
        <div className="p-3 sm:p-4">
          {/* Grouped Conditions */}
          {hasGroupedConditions ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Grouped Conditions</h4>
                <button
                  onClick={addConditionGroup}
                  className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Condition</span>
                </button>
              </div>
              
              {rule.conditions.map((condition, conditionIndex) => (
                <div key={conditionIndex} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Condition {conditionIndex + 1}
                    </span>
                    <div className="flex items-center space-x-2">
                      {conditionIndex > 0 && (
                        <select
                          value={condition.operator || 'AND'}
                          onChange={(e) => updateCondition(conditionIndex, 'operator', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      )}
                      <button
                        onClick={() => removeCondition(conditionIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Layout for Grouped Conditions */}
                  <div className="block sm:hidden space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        If Field
                      </label>
                      <select
                        value={condition.triggerFieldId || ''}
                        onChange={(e) => updateCondition(conditionIndex, 'triggerFieldId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select field</option>
                        {allFields.filter(field => supportsConditionalLogic(field.type)).map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Condition
                      </label>
                      <select
                        value={condition.state || ''}
                        onChange={(e) => updateCondition(conditionIndex, 'state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select condition</option>
                        {(condition.triggerFieldId ? 
                          getConditionStatesForFieldType(getTriggerField(condition.triggerFieldId)?.type) : 
                          CONDITION_STATES
                        ).map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>

                    {!['is empty', 'is not empty'].includes(condition.state) && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Value
                        </label>
                        {renderValueInput(
                          condition.triggerFieldId,
                          condition.value,
                          (value) => updateCondition(conditionIndex, 'value', value)
                        )}
                      </div>
                    )}
                  </div>

                  {/* Desktop Layout for Grouped Conditions */}
                  <div className="hidden sm:grid sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        If Field
                      </label>
                      <select
                        value={condition.triggerFieldId || ''}
                        onChange={(e) => updateCondition(conditionIndex, 'triggerFieldId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select field</option>
                        {allFields.filter(field => supportsConditionalLogic(field.type)).map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condition
                      </label>
                      <select
                        value={condition.state || ''}
                        onChange={(e) => updateCondition(conditionIndex, 'state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select condition</option>
                        {CONDITION_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>

                    {!['is empty', 'is not empty'].includes(condition.state) ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Value
                        </label>
                        {renderValueInput(
                          condition.triggerFieldId,
                          condition.value,
                          (value) => updateCondition(conditionIndex, 'value', value)
                        )}
                      </div>
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>
              ))}

              {/* Action for Grouped Conditions */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Then Action
                </label>
                {type === 'field' ? (
                  <select
                    value={`${rule.action || 'show'}:${rule.targetFieldId || ''}`}
                    onChange={(e) => {
                      const [action, targetFieldId] = e.target.value.split(':');
                      handleFieldChange('action', action);
                      handleFieldChange('targetFieldId', targetFieldId);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select action</option>
                    {allFields.map((field) => (
                      <React.Fragment key={field.id}>
                        <option value={`show:${field.id}`}>👁 Show {field.label}</option>
                        <option value={`hide:${field.id}`}>⛔ Hide {field.label}</option>
                      </React.Fragment>
                    ))}
                  </select>
                ) : (
                  <select
                    value={`${rule.action || 'skip to'}:${rule.targetPageId || ''}`}
                    onChange={(e) => {
                      const [action, targetPageId] = e.target.value.split(':');
                      handleFieldChange('action', action);
                      handleFieldChange('targetPageId', targetPageId);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select action</option>
                    {allPages.map((page) => (
                      <React.Fragment key={page.id}>
                        <option value={`skip to:${page.id}`}>🧭 Skip to {page.name}</option>
                        <option value={`hide page:${page.id}`}>⛔ Hide {page.name}</option>
                      </React.Fragment>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ) : (
            /* Single Condition Layout */
            <>
              {/* Mobile Layout */}
              <div className="block sm:hidden space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    If Field
                  </label>
                  <select
                    value={rule.triggerFieldId || ''}
                    onChange={(e) => handleFieldChange('triggerFieldId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select field</option>
                    {allFields.filter(field => supportsConditionalLogic(field.type)).map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    value={rule.state || ''}
                    onChange={(e) => handleFieldChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select condition</option>
                    {CONDITION_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {!['is empty', 'is not empty'].includes(rule.state) && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Value
                    </label>
                    {renderValueInput(rule.triggerFieldId, rule.value, (value) => handleFieldChange('value', value))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Then
                  </label>
                  {type === 'field' ? (
                    <select
                      value={`${rule.action || 'show'}:${rule.targetFieldId || ''}`}
                      onChange={(e) => {
                        const [action, targetFieldId] = e.target.value.split(':');
                        handleFieldChange('action', action);
                        handleFieldChange('targetFieldId', targetFieldId);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select action</option>
                      {allFields.map((field) => (
                        <React.Fragment key={field.id}>
                          <option value={`show:${field.id}`}>👁 Show {field.label}</option>
                          <option value={`hide:${field.id}`}>⛔ Hide {field.label}</option>
                        </React.Fragment>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={`${rule.action || 'skip to'}:${rule.targetPageId || ''}`}
                      onChange={(e) => {
                        const [action, targetPageId] = e.target.value.split(':');
                        handleFieldChange('action', action);
                        handleFieldChange('targetPageId', targetPageId);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select action</option>
                      {allPages.map((page) => (
                        <React.Fragment key={page.id}>
                          <option value={`skip to:${page.id}`}>🧭 Skip to {page.name}</option>
                          <option value={`hide page:${page.id}`}>⛔ Hide {page.name}</option>
                        </React.Fragment>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:grid sm:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    If Field
                  </label>
                  <select
                    value={rule.triggerFieldId || ''}
                    onChange={(e) => handleFieldChange('triggerFieldId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select field</option>
                    {allFields.filter(field => supportsConditionalLogic(field.type)).map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    value={rule.state || ''}
                    onChange={(e) => handleFieldChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select condition</option>
                    {CONDITION_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {!['is empty', 'is not empty'].includes(rule.state) ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value
                    </label>
                    {renderValueInput(rule.triggerFieldId, rule.value, (value) => handleFieldChange('value', value))}
                  </div>
                ) : (
                  <div></div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Then
                  </label>
                  {type === 'field' ? (
                    <select
                      value={`${rule.action || 'show'}:${rule.targetFieldId || ''}`}
                      onChange={(e) => {
                        const [action, targetFieldId] = e.target.value.split(':');
                        handleFieldChange('action', action);
                        handleFieldChange('targetFieldId', targetFieldId);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select action</option>
                      {allFields.map((field) => (
                        <React.Fragment key={field.id}>
                          <option value={`show:${field.id}`}>👁 Show {field.label}</option>
                          <option value={`hide:${field.id}`}>⛔ Hide {field.label}</option>
                        </React.Fragment>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={`${rule.action || 'skip to'}:${rule.targetPageId || ''}`}
                      onChange={(e) => {
                        const [action, targetPageId] = e.target.value.split(':');
                        handleFieldChange('action', action);
                        handleFieldChange('targetPageId', targetPageId);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select action</option>
                      {allPages.map((page) => (
                        <React.Fragment key={page.id}>
                          <option value={`skip to:${page.id}`}>🧭 Skip to {page.name}</option>
                          <option value={`hide page:${page.id}`}>⛔ Hide {page.name}</option>
                        </React.Fragment>
                      ))}
                    </select>
                  )}
                </div>

                <div></div>
              </div>
            </>
          )}

          {/* Rule Preview */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Preview:</span> 
              {hasGroupedConditions ? (
                <>
                  {' '}Multiple conditions with {rule.conditions?.[1]?.operator || 'AND'} logic → then{' '}
                  <span className="font-semibold text-green-600">
                    {rule.action || 'action'}
                  </span>{' '}
                  <span className="font-semibold text-purple-600">
                    {type === 'field' 
                      ? allFields.find(f => f.id === rule.targetFieldId)?.label || 'Target Field'
                      : allPages.find(p => p.id === rule.targetPageId)?.name || 'Target Page'
                    }
                  </span>
                </>
              ) : (
                <>
                  If{' '}
                  <span className="font-semibold text-purple-600">
                    {allFields.find(f => f.id === rule.triggerFieldId)?.label || 'Field'}
                  </span>{' '}
                  <span className="text-gray-600">{rule.state || 'condition'}</span>{' '}
                  {!['is empty', 'is not empty'].includes(rule.state) && (
                    <>
                      <span className="font-semibold text-blue-600">"{rule.value || 'value'}"</span>{' '}
                    </>
                  )}
                  → <span className="text-gray-600">then</span>{' '}
                  <span className="font-semibold text-green-600">
                    {rule.action || 'action'}
                  </span>{' '}
                  <span className="font-semibold text-purple-600">
                    {type === 'field' 
                      ? allFields.find(f => f.id === rule.targetFieldId)?.label || 'Target Field'
                      : allPages.find(p => p.id === rule.targetPageId)?.name || 'Target Page'
                    }
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionalRuleBlock;