import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from '../contexts/FormContext';
import { CONDITION_STATES } from '../constants';
import Navbar from '../components/Navbar';
import ConditionalRuleBlock from '../components/ConditionalLogic/ConditionalRuleBlock';
import { 
  ArrowLeft, 
  Plus, 
  Info,
  Eye,
  EyeOff,
  SkipForward,
  X,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const ConditionalLogic = () => {
  const { formId } = useParams();
  const { 
    forms, 
    fieldConditions, 
    pageConditions,
    addFieldCondition,
    removeFieldCondition,
    addPageCondition,
    removePageCondition,
    updateFieldCondition,
    updatePageCondition
  } = useForm();
  
  const [activeTab, setActiveTab] = useState('fields');
  const [showInfo, setShowInfo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const form = forms.find(f => f.id === formId);

  const handleAddFieldCondition = () => {
    if (!form || form.pages.length === 0) return;
    
    const firstField = form.pages[0].fields[0];
    if (!firstField) return;

    addFieldCondition({
      formId: form.id,
      triggerFieldId: firstField.id,
      state: 'is equal to',
      value: '',
      targetFieldId: firstField.id,
      action: 'show'
    });
  };

  const handleAddPageCondition = () => {
    if (!form || form.pages.length === 0) return;
    
    const firstField = form.pages[0].fields[0];
    if (!firstField) return;

    addPageCondition({
      formId: form.id,
      triggerFieldId: firstField.id,
      state: 'is equal to',
      value: '',
      targetPageId: form.pages[0].id,
      action: 'skip to'
    });
  };

  const handleUpdateFieldCondition = (conditionId, updates) => {
    updateFieldCondition(conditionId, updates);
  };

  const handleUpdatePageCondition = (conditionId, updates) => {
    updatePageCondition(conditionId, updates);
  };

  const getAllFields = () => {
    if (!form) return [];
    return form.pages.flatMap(page => 
      page.fields.map(field => ({
        ...field,
        pageId: page.id,
        pageName: page.name
      }))
    );
  };

  const validateConditions = () => {
    const formFieldConditions = fieldConditions.filter(c => c.formId === formId);
    const formPageConditions = pageConditions.filter(c => c.formId === formId);
    
    const allConditions = [...formFieldConditions, ...formPageConditions];
    
    for (const condition of allConditions) {
      // Check if trigger field exists
      const triggerField = allFields.find(f => f.id === condition.triggerFieldId);
      if (!triggerField) return false;
      
      if (!condition.triggerFieldId || !condition.state) {
        return false;
      }
      
      // Validate value based on field type and condition
      if (!['is empty', 'is not empty'].includes(condition.state) && !condition.value) {
        return false;
      }
      
      // Validate value matches field type
      if (condition.value && triggerField) {
        if (triggerField.type === 'number' && condition.state.includes('greater') || condition.state.includes('less')) {
          if (isNaN(parseFloat(condition.value))) return false;
        }
        if ((triggerField.type === 'select' || triggerField.type === 'radio') && condition.value) {
          if (!triggerField.options?.includes(condition.value)) return false;
        }
      }
      
      if (activeTab === 'fields' && !condition.targetFieldId) {
        return false;
      }
      if (activeTab === 'pages' && !condition.targetPageId) {
        return false;
      }
    }
    
    return allConditions.length > 0;
  };

  const handleSaveConditions = async () => {
    if (!validateConditions()) {
      setSaveMessage('Please complete all condition fields before saving.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setIsSaving(true);
    
    // Simulate save operation
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('✅ Conditions saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 1000);
  };

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Form not found</h1>
            <Link to="/dashboard" className="text-purple-600 hover:text-purple-700">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allFields = getAllFields();
  const formFieldConditions = fieldConditions.filter(c => c.formId === formId);
  const formPageConditions = pageConditions.filter(c => c.formId === formId);
  const canSave = validateConditions();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="mb-6">
          <Link
            to={`/form-builder/${form.id}`}
            className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Form Builder
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Conditional Logic</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Create smart forms that adapt to user responses</p>
              </div>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="flex items-center space-x-1 sm:space-x-2 text-purple-600 hover:text-purple-700 transition-colors text-sm sm:text-base"
              >
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Help</span>
              </button>
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
                saveMessage.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {saveMessage.includes('✅') ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{saveMessage}</span>
              </div>
            )}

            {/* Info Panel */}
            {showInfo && (
              <div className="mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">How Conditional Logic Works</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p><strong>Field Conditions:</strong> Show or hide specific fields based on user responses.</p>
                      <p><strong>Page Conditions:</strong> Skip to specific pages or hide entire pages based on responses.</p>
                      <p><strong>Example:</strong> If "Do you have a pet?" equals "Yes", then show "What is your pet's name?"</p>
                      <p><strong>Tip:</strong> Use "is empty" or "is not empty" conditions when you don't need to specify a value.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('fields')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'fields'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Show/Hide Fields</span>
                {formFieldConditions.length > 0 && (
                  <span className="bg-purple-200 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                    {formFieldConditions.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('pages')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'pages'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <SkipForward className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Skip/Hide Pages</span>
                {formPageConditions.length > 0 && (
                  <span className="bg-purple-200 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                    {formPageConditions.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'fields' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Field Conditions</h2>
                    <p className="text-sm text-gray-600 mt-1">Control which fields are visible based on user input</p>
                  </div>
                  <button
                    onClick={handleAddFieldCondition}
                    disabled={allFields.length === 0}
                    className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Field Condition</span>
                  </button>
                </div>

                {allFields.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-6">
                    <p className="text-yellow-800 text-sm sm:text-base">
                      You need to add fields to your form before creating conditions.{' '}
                      <Link to={`/form-builder/${form.id}`} className="text-yellow-900 underline">
                        Add fields to your form
                      </Link>
                    </p>
                  </div>
                )}

                {formFieldConditions.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <EyeOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No field conditions</h3>
                    <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                      Add conditions to show or hide fields based on user responses. This makes your forms more dynamic and user-friendly.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formFieldConditions.map((condition, index) => (
                      <ConditionalRuleBlock
                        key={condition.id}
                        rule={condition}
                        allFields={allFields}
                        allPages={form.pages}
                        onUpdateRule={handleUpdateFieldCondition}
                        onRemoveRule={removeFieldCondition}
                        type="field"
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pages' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Page Conditions</h2>
                    <p className="text-sm text-gray-600 mt-1">Control page navigation based on user responses</p>
                  </div>
                  <button
                    onClick={handleAddPageCondition}
                    disabled={allFields.length === 0 || form.pages.length < 2}
                    className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Page Condition</span>
                  </button>
                </div>

                {form.pages.length < 2 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-6">
                    <p className="text-yellow-800 text-sm sm:text-base">
                      You need at least 2 pages to create page conditions.{' '}
                      <Link to={`/form-builder/${form.id}`} className="text-yellow-900 underline">
                        Add more pages to your form
                      </Link>
                    </p>
                  </div>
                )}

                {formPageConditions.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <SkipForward className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No page conditions</h3>
                    <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                      Add conditions to skip pages or hide them based on user responses. Create personalized form flows.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formPageConditions.map((condition, index) => (
                      <ConditionalRuleBlock
                        key={condition.id}
                        rule={condition}
                        allFields={allFields}
                        allPages={form.pages}
                        onUpdateRule={handleUpdatePageCondition}
                        onRemoveRule={removePageCondition}
                        type="page"
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Save Button - Fixed Bottom on Mobile, Bottom Right on Desktop */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 sm:relative sm:bg-transparent sm:border-t-0 sm:p-0 sm:mt-6 sm:flex sm:justify-end">
          <button
            onClick={handleSaveConditions}
            disabled={!canSave || isSaving}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              canSave && !isSaving
                ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Conditions</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile spacing for fixed button */}
        <div className="h-20 sm:hidden"></div>
      </div>
    </div>
  );
};

export default ConditionalLogic;