import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from '../contexts/FormContext';
import { MAX_PAGES } from '../constants';
import Navbar from '../components/Navbar';
import FieldPalette from '../components/FormBuilder/FieldPalette';
import FormCanvas from '../components/FormBuilder/FormCanvas';
import PropertyPanel from '../components/FormBuilder/PropertyPanel';
import ShareModal from '../components/ShareModal';
import { 
  Save, 
  Eye, 
  Share, 
  Settings, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  GitBranch,
  Trash2,
  Check,
  Layers,
  Edit3
} from 'lucide-react';

const FormBuilder = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { 
    forms, 
    currentForm, 
    setCurrentForm, 
    createForm, 
    updateForm, 
    addField, 
    updateField, 
    removeField,
    addFormPage,
    deleteFormPage
  } = useForm();

  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPropertyPanelOpen, setIsPropertyPanelOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAutoSaved, setShowAutoSaved] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  const [mobileActiveTab, setMobileActiveTab] = useState('form'); // 'fields', 'form', 'props'
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  useEffect(() => {
    if (formId) {
      const form = forms.find(f => f.id === formId);
      if (form) {
        setCurrentForm(form);
      } else {
        navigate('/dashboard');
      }
    } else {
      // Create new form
      const newForm = createForm({ name: 'Untitled Form' });
      navigate(`/form-builder/${newForm.id}`, { replace: true });
    }
  }, [formId, forms, setCurrentForm, createForm, navigate]);

  const handleAddField = (fieldData) => {
    if (currentForm) {
      const currentPage = currentForm.pages[currentPageIndex];
      addField(currentForm.id, currentPage.id, fieldData);
      triggerAutoSave();
      // Switch to form view on mobile after adding field
      if (window.innerWidth < 1024) {
        setMobileActiveTab('form');
      }
    }
  };

  const handleUpdateField = (fieldId, updates) => {
    if (currentForm) {
      const currentPage = currentForm.pages[currentPageIndex];
      updateField(currentForm.id, currentPage.id, fieldId, updates);
      triggerAutoSave();
    }
  };

  const handleRemoveField = (fieldId) => {
    if (currentForm) {
      const currentPage = currentForm.pages[currentPageIndex];
      removeField(currentForm.id, currentPage.id, fieldId);
      if (selectedFieldId === fieldId) {
        setSelectedFieldId(null);
        setIsPropertyPanelOpen(false);
      }
      triggerAutoSave();
    }
  };

  const handleSelectField = (fieldId) => {
    setSelectedFieldId(fieldId);
    setIsPropertyPanelOpen(true);
    // Switch to props view on mobile when field is selected
    if (window.innerWidth < 1024) {
      setMobileActiveTab('props');
    }
  };

  const handleReorderFields = (sourceIndex, destIndex, newField = null) => {
    if (!currentForm) return;
    
    const currentPage = currentForm.pages[currentPageIndex];
    const newFields = [...currentPage.fields];
    
    if (newField) {
      newFields.splice(destIndex, 0, newField);
    } else {
      const [removed] = newFields.splice(sourceIndex, 1);
      newFields.splice(destIndex, 0, removed);
    }

    updateForm(currentForm.id, {
      pages: currentForm.pages.map((page, index) => 
        index === currentPageIndex 
          ? { ...page, fields: newFields }
          : page
      )
    });
    triggerAutoSave();
  };

  const triggerAutoSave = () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      handleAutoSave();
      setShowAutoSaved(true);
      setTimeout(() => setShowAutoSaved(false), 3000);
    }, 1500);
    
    setAutoSaveTimeout(timeout);
  };


  const handleSaveForm = () => {
    if (currentForm) {
      updateForm(currentForm.id, {
        updatedAt: new Date().toISOString()
      });
      setShowSaveSuccess(true);
      setTimeout(() => {
        setShowSaveSuccess(false);
        navigate('/my-forms');
      }, 2000);
    }
  };

  const handleAutoSave = () => {
    if (currentForm) {
      updateForm(currentForm.id, {
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleAddPage = () => {
    if (currentForm && currentForm.pages.length < MAX_PAGES) {
      addFormPage(currentForm.id);
      // Navigate to the new page
      setCurrentPageIndex(currentForm.pages.length);
      triggerAutoSave();
    }
  };

  const handleDeletePage = () => {
    if (currentForm && currentForm.pages.length > 1) {
      deleteFormPage(currentForm.id, currentPageIndex);
      if (currentPageIndex > 0) {
        setCurrentPageIndex(currentPageIndex - 1);
      } else if (currentForm.pages.length > 1) {
        setCurrentPageIndex(0);
      }
      triggerAutoSave();
    }
  };

  const handlePreviousPage = () => {
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
  };

  const handleNextPage = () => {
    setCurrentPageIndex(Math.min(currentForm.pages.length - 1, currentPageIndex + 1));
  };

  const selectedField = currentForm?.pages[currentPageIndex]?.fields.find(
    field => field.id === selectedFieldId
  );

  const currentPage = currentForm?.pages[currentPageIndex];

  if (!currentForm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Form Builder Header - Restructured with Three Sections */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 relative">
            {/* Left Section: Form name and auto-save status */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0 max-w-xs lg:max-w-md">
              <div className="relative flex items-center">
                <Edit3 className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                value={currentForm.name}
                  onChange={(e) => {
                    updateForm(currentForm.id, { name: e.target.value });
                    triggerAutoSave();
                  }}
                className="text-sm sm:text-lg lg:text-xl font-semibold bg-transparent border-none focus:ring-0 focus:outline-none min-w-0 flex-shrink truncate"
              />
              </div>
              {showAutoSaved && (
                <div className="flex items-center space-x-1 text-green-600 text-xs sm:text-sm whitespace-nowrap">
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">Autosaved</span>
                </div>
              )}
            </div>
            
            {/* Middle Section: Page navigation - Centered */}
            <div className="hidden lg:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-4 bg-gray-50 px-4 py-2 rounded-lg border">
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  Page {currentPageIndex + 1} of {currentForm.pages.length}
                </span>
                
                <div className="flex items-center space-x-2">
                  {currentPageIndex > 0 && (
                    <button
                      onClick={handlePreviousPage}
                      className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-all duration-200 bg-white hover:bg-purple-50 px-2 py-1 rounded border border-gray-200 hover:border-purple-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="text-sm font-medium">Previous</span>
                    </button>
                  )}
                  {currentPageIndex < currentForm.pages.length - 1 && (
                    <button
                      onClick={handleNextPage}
                      className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-all duration-200 bg-white hover:bg-purple-50 px-2 py-1 rounded border border-gray-200 hover:border-purple-300"
                    >
                      <span className="text-sm font-medium">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Section: Action buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-1 justify-end">
              <Link
                to={`/conditional-logic/${currentForm.id}`}
                className="text-gray-600 hover:text-purple-600 transition-colors p-2"
                title="Conditional Logic"
              >
                <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <button
                onClick={() => setShowShareModal(true)}
                className="hidden sm:flex items-center space-x-1 lg:space-x-2 bg-green-600 text-white px-2 lg:px-4 py-1 lg:py-2 rounded-lg hover:bg-green-700 transition-colors text-xs lg:text-sm"
              >
                <Share className="w-4 h-4" />
                <span className="hidden lg:inline">Share</span>
              </button>
              <button
                onClick={handleSaveForm}
                className="hidden sm:flex items-center space-x-1 lg:space-x-2 bg-purple-600 text-white px-2 lg:px-4 py-1 lg:py-2 rounded-lg hover:bg-purple-700 transition-colors text-xs lg:text-sm"
              >
                <Save className="w-4 h-4" />
                <span className="hidden lg:inline">Save</span>
              </button>
              <Link
                to={`/form-preview/${currentForm.id}`}
                className="flex items-center space-x-1 lg:space-x-2 bg-gray-600 text-white px-2 lg:px-4 py-1 lg:py-2 rounded-lg hover:bg-gray-700 transition-colors text-xs lg:text-sm"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden lg:inline">Preview</span>
              </Link>
            </div>
          </div>

          {/* Mobile Page Navigation */}
          <div className="lg:hidden border-t border-gray-200 px-2 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Page {currentPageIndex + 1} of {currentForm.pages.length}
              </span>
              <div className="flex items-center space-x-2">
                {currentPageIndex > 0 && (
                  <button
                    onClick={handlePreviousPage}
                    className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 bg-gray-50 px-2 py-1 rounded border text-xs"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span>Prev</span>
                  </button>
                )}
                {currentPageIndex < currentForm.pages.length - 1 && (
                  <button
                    onClick={handleNextPage}
                    className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 bg-gray-50 px-2 py-1 rounded border text-xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Controls - Positioned outside main container */}
        <div className="hidden lg:block absolute right-8 top-28">
          <div className="flex flex-col space-y-2">
            {currentForm.pages.length > 1 && (
              <button
                onClick={handleDeletePage}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-all duration-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg border border-red-200 hover:border-red-300 text-sm whitespace-nowrap shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-medium">Delete Page</span>
              </button>
            )}
            {currentForm.pages.length < MAX_PAGES && (
              <button
                onClick={handleAddPage}
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-all duration-200 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg border border-purple-200 hover:border-purple-300 text-sm whitespace-nowrap shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Add Page</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-[calc(100vh-64px)]">
        <FieldPalette onAddField={handleAddField} />
        
        <div className="flex-1 flex flex-col">
          <FormCanvas
            form={currentForm}
            currentPageId={currentPage?.id}
            onUpdateField={handleUpdateField}
            onRemoveField={handleRemoveField}
            onSelectField={handleSelectField}
            selectedFieldId={selectedFieldId}
            onReorderFields={handleReorderFields}
            onSaveForm={handleSaveForm}
            onAddField={handleAddField}
          />
        </div>
        
        {isPropertyPanelOpen && (
          <PropertyPanel
            field={selectedField}
            onUpdateField={(updates) => {
              if (selectedFieldId) {
                handleUpdateField(selectedFieldId, updates);
              }
            }}
            onClose={() => setIsPropertyPanelOpen(false)}
          />
        )}
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden h-[calc(100vh-112px)] flex flex-col">
        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {mobileActiveTab === 'fields' && (
            <FieldPalette onAddField={handleAddField} />
          )}
          
          {mobileActiveTab === 'form' && (
            <div className="h-full flex flex-col">
              {/* Mobile Page Controls */}
              <div className="bg-white border-b border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Page Controls
                  </span>
                  <div className="flex space-x-2">
                    {currentForm.pages.length > 1 && (
                      <button
                        onClick={handleDeletePage}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                    {currentForm.pages.length < MAX_PAGES && (
                      <button
                        onClick={handleAddPage}
                        className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded text-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <FormCanvas
                form={currentForm}
                currentPageId={currentPage?.id}
                onUpdateField={handleUpdateField}
                onRemoveField={handleRemoveField}
                onSelectField={handleSelectField}
                selectedFieldId={selectedFieldId}
                onReorderFields={handleReorderFields}
                onSaveForm={handleSaveForm}
              />
            </div>
          )}
          
          {mobileActiveTab === 'props' && (
            <PropertyPanel
              field={selectedField}
              onUpdateField={(updates) => {
                if (selectedFieldId) {
                  handleUpdateField(selectedFieldId, updates);
                }
              }}
              onClose={() => {
                setIsPropertyPanelOpen(false);
                setMobileActiveTab('form');
              }}
            />
          )}
        </div>

        {/* Mobile Bottom Tab Bar */}
        <div className="bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
          <div className="flex items-center justify-around">
            <button
              onClick={() => setMobileActiveTab('fields')}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                mobileActiveTab === 'fields'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span className="text-xs font-medium">Fields</span>
            </button>
            
            <button
              onClick={() => setMobileActiveTab('form')}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                mobileActiveTab === 'form'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <Edit3 className="w-5 h-5" />
              <span className="text-xs font-medium">Form</span>
            </button>
            
            <button
              onClick={() => setMobileActiveTab('props')}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                mobileActiveTab === 'props'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs font-medium">Props</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Save Success Modal */}
      {showSaveSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Form Saved Successfully!</h3>
              <p className="text-gray-600">Redirecting to My Forms...</p>
            </div>
          </div>
        </div>
      )}
      
      {showShareModal && (
        <ShareModal form={currentForm} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
};

export default FormBuilder;