import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { formAPI } from '../services/api';
import { MAX_PAGES } from '../constants';

const FormContext = createContext();

export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};

export const FormProvider = ({ children }) => {
  // State Management
  const [forms, setForms] = useState([]);
  const [currentForm, setCurrentForm] = useState(null);
  const [fieldConditions, setFieldConditions] = useState([]);
  const [pageConditions, setPageConditions] = useState([]);
  const [chatbotSettings, setChatbotSettings] = useState({
    enabled: false,
    welcomeMessage: 'Hi! How can I help you today?',
    position: 'bottom-right',
    theme: 'purple'
  });

  // Loading and Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Error Handling Helper
  const handleError = useCallback((error, operation) => {
    console.error(`FormContext ${operation} error:`, error);
    const errorMessage = error.response?.data?.message || error.message || `Failed to ${operation}`;
    setError(errorMessage);
    
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
    
    return null;
  }, []);

  // Convert backend form data to frontend format
  const convertBackendToFrontend = useCallback((backendForm) => {
    return {
      id: backendForm._id,
      name: backendForm.title,
      fields: backendForm.fields || [],
      // Convert flat fields to page structure for frontend compatibility
      pages: [{ 
        id: 'page-1', 
        name: 'Page 1', 
        fields: backendForm.fields || [] 
      }],
      status: backendForm.status,
      visibility: backendForm.status === 'published' ? 'public' : 'private',
      responses: backendForm.responses || [],
      createdAt: backendForm.createdAt,
      updatedAt: backendForm.updatedAt,
      location: 'inbox', // Frontend concept
      views: backendForm.views || 0
    };
  }, []);

  // Convert frontend form data to backend format
  const convertFrontendToBackend = useCallback((frontendForm) => {
    // Flatten all fields from all pages for backend
    const allFields = frontendForm.pages ? 
      frontendForm.pages.flatMap(page => page.fields) : 
      frontendForm.fields || [];

    return {
      title: frontendForm.name || 'Untitled Form',
      fields: allFields,
      status: frontendForm.status || 'draft'
    };
  }, []);

  // Initialize: Load forms from API
  useEffect(() => {
    const loadForms = async () => {
      if (isInitialized) return;
      
      setIsLoading(true);
      try {
        const response = await formAPI.getAllForms({
          page: 1,
          limit: 50, // Load more forms initially
          sortBy: 'updatedAt',
          sortOrder: 'desc'
        });
        
        if (response.success) {
          const convertedForms = response.data.forms.map(convertBackendToFrontend);
          setForms(convertedForms);
        }
      } catch (error) {
        handleError(error, 'load forms');
        // Fallback to localStorage if API fails
        const savedForms = localStorage.getItem('formula_forms');
        if (savedForms) {
          setForms(JSON.parse(savedForms));
        }
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadForms();
  }, [isInitialized, convertBackendToFrontend, handleError]);

  // Create Form - API Integration
  const createForm = useCallback(async (formData) => {
    console.log('FormContextAPI: Starting form creation with data:', formData);
    setIsLoading(true);
    try {
      const backendData = {
        title: formData.name || 'Untitled Form',
        fields: [],
        status: 'draft'
      };
      
      console.log('FormContextAPI: Sending backend data:', backendData);
      const response = await formAPI.createForm(backendData);
      console.log('FormContextAPI: Received response:', response);
      
      if (response.success) {
        const newForm = convertBackendToFrontend(response.data);
        console.log('FormContextAPI: Converted form:', newForm);
        
        setForms(prev => [newForm, ...prev]);
        setCurrentForm(newForm);
        
        return newForm;
      } else {
        console.error('FormContextAPI: Response was not successful:', response);
        setError('Failed to create form: Response not successful');
        return null;
      }
    } catch (error) {
      console.error('FormContextAPI: Error creating form:', error);
      return handleError(error, 'create form');
    } finally {
      setIsLoading(false);
    }
  }, [convertBackendToFrontend, handleError]);

  // Update Form - API Integration
  const updateForm = useCallback(async (formId, updates) => {
    try {
      const currentFormData = forms.find(f => f.id === formId);
      if (!currentFormData) return;

      // Create updated form object
      const updatedFormData = { ...currentFormData, ...updates };
      const backendData = convertFrontendToBackend(updatedFormData);

      const response = await formAPI.updateForm(formId, backendData);
      
      if (response.success) {
        const updatedForm = convertBackendToFrontend(response.data);
        
        setForms(prev => prev.map(form => 
          form.id === formId ? updatedForm : form
        ));
        
        if (currentForm && currentForm.id === formId) {
          setCurrentForm(updatedForm);
        }
        
        return updatedForm;
      }
    } catch (error) {
      handleError(error, 'update form');
      
      // Fallback: update local state only
      setForms(prev => prev.map(form => 
        form.id === formId 
          ? { ...form, ...updates, updatedAt: new Date().toISOString() }
          : form
      ));
      
      if (currentForm && currentForm.id === formId) {
        setCurrentForm(prev => ({ ...prev, ...updates }));
      }
    }
  }, [forms, currentForm, convertFrontendToBackend, convertBackendToFrontend, handleError]);

  // Delete Form - API Integration
  const deleteForm = useCallback(async (formId) => {
    setIsLoading(true);
    try {
      const response = await formAPI.deleteForm(formId);
      
      if (response.success) {
        setForms(prev => prev.filter(form => form.id !== formId));
        
        // Clean up related data
        setFieldConditions(prev => prev.filter(condition => condition.formId !== formId));
        setPageConditions(prev => prev.filter(condition => condition.formId !== formId));
        
        if (currentForm && currentForm.id === formId) {
          setCurrentForm(null);
        }
        
        return true;
      }
    } catch (error) {
      handleError(error, 'delete form');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentForm, handleError]);

  // Move to Trash (Soft Delete)
  const moveFormToTrash = useCallback((formId) => {
    updateForm(formId, { location: 'trash' });
  }, [updateForm]);

  // Move to Archive
  const moveFormToArchive = useCallback((formId) => {
    updateForm(formId, { location: 'archive' });
  }, [updateForm]);

  // Restore Form
  const restoreForm = useCallback((formId) => {
    updateForm(formId, { location: 'inbox' });
  }, [updateForm]);

  // Add Field - With Auto-save
  const addField = useCallback(async (formId, pageId, field) => {
    const newField = {
      id: uuidv4(),
      ...field,
      createdAt: new Date().toISOString()
    };
    
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    const updatedPages = form.pages.map(page => 
      page.id === pageId 
        ? { ...page, fields: [...page.fields, newField] }
        : page
    );

    // Update form with new field and auto-save to API
    await updateForm(formId, { pages: updatedPages });
  }, [forms, updateForm]);

  // Update Field - With Auto-save
  const updateField = useCallback(async (formId, pageId, fieldId, updates) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    const updatedPages = form.pages.map(page => 
      page.id === pageId 
        ? {
            ...page,
            fields: page.fields.map(field => 
              field.id === fieldId 
                ? { ...field, ...updates }
                : field
            )
          }
        : page
    );

    // Update form with modified field and auto-save to API
    await updateForm(formId, { pages: updatedPages });
  }, [forms, updateForm]);

  // Remove Field - With Auto-save
  const removeField = useCallback(async (formId, pageId, fieldId) => {
    // Clean up related conditions
    setFieldConditions(prev => prev.filter(condition => 
      condition.triggerFieldId !== fieldId && condition.targetFieldId !== fieldId
    ));
    setPageConditions(prev => prev.filter(condition => 
      condition.triggerFieldId !== fieldId
    ));
    
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    const updatedPages = form.pages.map(page => 
      page.id === pageId 
        ? { ...page, fields: page.fields.filter(field => field.id !== fieldId) }
        : page
    );

    // Update form with removed field and auto-save to API
    await updateForm(formId, { pages: updatedPages });
  }, [forms, updateForm]);

  // Add Form Page
  const addFormPage = useCallback(async (formId) => {
    const form = forms.find(f => f.id === formId);
    if (!form || form.pages.length >= MAX_PAGES) return;
    
    const newPage = {
      id: uuidv4(),
      name: `Page ${form.pages.length + 1}`,
      fields: []
    };
    
    await updateForm(formId, {
      pages: [...form.pages, newPage]
    });
  }, [forms, updateForm]);

  // Delete Form Page
  const deleteFormPage = useCallback(async (formId, pageIndex) => {
    const form = forms.find(f => f.id === formId);
    if (!form || form.pages.length <= 1) return;
    
    const pageToDelete = form.pages[pageIndex];
    const fieldsToDelete = pageToDelete.fields.map(f => f.id);
    
    // Clean up conditional logic for deleted page and fields
    setFieldConditions(prev => prev.filter(condition => 
      !fieldsToDelete.includes(condition.triggerFieldId) && 
      !fieldsToDelete.includes(condition.targetFieldId)
    ));
    
    setPageConditions(prev => prev.filter(condition => 
      !fieldsToDelete.includes(condition.triggerFieldId) && 
      condition.targetPageId !== pageToDelete.id
    ));
    
    const newPages = form.pages.filter((_, index) => index !== pageIndex);
    await updateForm(formId, { pages: newPages });
  }, [forms, updateForm]);

  // Load specific form by ID
  const loadFormById = useCallback(async (formId) => {
    setIsLoading(true);
    try {
      const response = await formAPI.getFormById(formId);
      
      if (response.success) {
        const form = convertBackendToFrontend(response.data);
        setCurrentForm(form);
        
        // Update forms list if this form exists
        setForms(prev => {
          const existingIndex = prev.findIndex(f => f.id === formId);
          if (existingIndex >= 0) {
            const newForms = [...prev];
            newForms[existingIndex] = form;
            return newForms;
          }
          return [form, ...prev];
        });
        
        return form;
      }
    } catch (error) {
      handleError(error, 'load form');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [convertBackendToFrontend, handleError]);

  // Conditional Logic Functions (kept as localStorage for now)
  const addFieldCondition = useCallback((condition) => {
    const newCondition = {
      id: uuidv4(),
      ...condition
    };
    setFieldConditions(prev => [...prev, newCondition]);
  }, []);

  const removeFieldCondition = useCallback((id) => {
    setFieldConditions(prev => prev.filter(condition => condition.id !== id));
  }, []);

  const addPageCondition = useCallback((condition) => {
    const newCondition = {
      id: uuidv4(),
      ...condition
    };
    setPageConditions(prev => [...prev, newCondition]);
  }, []);

  const removePageCondition = useCallback((id) => {
    setPageConditions(prev => prev.filter(condition => condition.id !== id));
  }, []);

  const updateFieldCondition = useCallback((id, updates) => {
    setFieldConditions(prev => prev.map(condition =>
      condition.id === id ? { ...condition, ...updates } : condition
    ));
  }, []);

  const updatePageCondition = useCallback((id, updates) => {
    setPageConditions(prev => prev.map(condition =>
      condition.id === id ? { ...condition, ...updates } : condition
    ));
  }, []);

  // Keep conditions in localStorage for backward compatibility
  useEffect(() => {
    localStorage.setItem('formula_field_conditions', JSON.stringify(fieldConditions));
  }, [fieldConditions]);

  useEffect(() => {
    localStorage.setItem('formula_page_conditions', JSON.stringify(pageConditions));
  }, [pageConditions]);

  // Load conditions from localStorage on init
  useEffect(() => {
    const savedFieldConditions = localStorage.getItem('formula_field_conditions');
    if (savedFieldConditions) {
      setFieldConditions(JSON.parse(savedFieldConditions));
    }
    
    const savedPageConditions = localStorage.getItem('formula_page_conditions');
    if (savedPageConditions) {
      setPageConditions(JSON.parse(savedPageConditions));
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // Data
    forms,
    currentForm,
    setCurrentForm,
    fieldConditions,
    pageConditions,
    chatbotSettings,
    setChatbotSettings,
    
    // State
    isLoading,
    error,
    isInitialized,
    
    // Form Operations
    createForm,
    updateForm,
    deleteForm,
    moveFormToTrash,
    moveFormToArchive,
    restoreForm,
    loadFormById,
    
    // Field Operations
    addField,
    updateField,
    removeField,
    
    // Page Operations
    addFormPage,
    deleteFormPage,
    
    // Condition Operations
    addFieldCondition,
    removeFieldCondition,
    addPageCondition,
    removePageCondition,
    updateFieldCondition,
    updatePageCondition
  }), [
    forms,
    currentForm,
    fieldConditions,
    pageConditions,
    chatbotSettings,
    isLoading,
    error,
    isInitialized,
    createForm,
    updateForm,
    deleteForm,
    moveFormToTrash,
    moveFormToArchive,
    restoreForm,
    loadFormById,
    addField,
    updateField,
    removeField,
    addFormPage,
    deleteFormPage,
    addFieldCondition,
    removeFieldCondition,
    addPageCondition,
    removePageCondition,
    updateFieldCondition,
    updatePageCondition
  ]);

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
};
