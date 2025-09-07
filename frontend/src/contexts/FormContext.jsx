import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { formAPI } from '../services/api';
import { useAuth } from './AuthContext';

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
  const { isAuthenticated, isLoading } = useAuth();
  const [forms, setForms] = useState([]);
  const [currentForm, setCurrentForm] = useState(null);
  const [fieldConditions, setFieldConditions] = useState([]);
  const [pageConditions, setPageConditions] = useState([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [chatbotSettings, setChatbotSettings] = useState({
    enabled: false,
    welcomeMessage: 'Hi! How can I help you today?',
    position: 'bottom-right',
    theme: 'purple'
  });

  // Load forms from backend API
  const loadForms = useCallback(async () => {
    const token = localStorage.getItem('formula_token');
    
    if (!token) {
      // No token, user not authenticated, don't load forms
      return;
    }

    try {
      setIsLoadingForms(true);
      const response = await formAPI.getAllForms();
      
      if (response.success) {
        // Transform backend form structure to match frontend structure
        // Handle both possible response formats
        const formsArray = response.data?.forms || response.forms || [];
        
        const transformedForms = formsArray.map(form => {
          // Properly handle multi-page forms from backend
          let pages = [];
          
          if (form.pages && form.pages.length > 0) {
            // Form has pages structure from backend
            pages = form.pages;
          } else if (form.fields && form.fields.length > 0) {
            // Legacy form - convert fields to single page
            pages = [{ id: 'page-1', name: 'Page 1', fields: form.fields }];
          } else {
            // Empty form - create default page
            pages = [{ id: 'page-1', name: 'Page 1', fields: [] }];
          }
          
          return {
            id: form._id,
            name: form.title || 'Untitled Form',  // Handle empty titles
            title: form.title || 'Untitled Form', // Handle empty titles
            fields: form.fields || [],
            pages: pages,
            status: form.status,
            visibility: 'private',
            responses: form.responses || [],
            createdAt: form.createdAt,
            updatedAt: form.updatedAt,
            location: 'inbox',
            views: form.views || 0,
            createdBy: form.createdBy
          };
        });
        
        setForms(transformedForms);
      }
    } catch (error) {
      console.error('Failed to load forms:', error);
      
      // Fallback to localStorage if API fails
      const savedForms = localStorage.getItem('formula_forms');
      if (savedForms) {
        setForms(JSON.parse(savedForms));
      }
    } finally {
      setIsLoadingForms(false);
    }
  }, []);

  useEffect(() => {
    // Load forms from API when component mounts and user is authenticated
    const token = localStorage.getItem('formula_token');
    if (token) {
      loadForms();
    }
    
    // Load conditions from localStorage (we'll migrate these to backend later)
    const savedFieldConditions = localStorage.getItem('formula_field_conditions');
    if (savedFieldConditions) {
      setFieldConditions(JSON.parse(savedFieldConditions));
    }
    
    const savedPageConditions = localStorage.getItem('formula_page_conditions');
    if (savedPageConditions) {
      setPageConditions(JSON.parse(savedPageConditions));
    }
  }, [loadForms]);

  useEffect(() => {
    // Keep localStorage as backup (will be removed later)
    localStorage.setItem('formula_forms', JSON.stringify(forms));
  }, [forms]);

  useEffect(() => {
    // Save conditions to localStorage
    localStorage.setItem('formula_field_conditions', JSON.stringify(fieldConditions));
  }, [fieldConditions]);

  useEffect(() => {
    localStorage.setItem('formula_page_conditions', JSON.stringify(pageConditions));
  }, [pageConditions]);

  // Reload forms when authentication status changes
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadForms();
    } else if (!isLoading && !isAuthenticated) {
      setForms([]);
    }
  }, [isAuthenticated, isLoading, loadForms]);

  const createForm = useCallback(async (formData) => {
    try {
      // Create form on backend
      const backendFormData = {
        title: formData.name || formData.title || 'Untitled Form',
        fields: [],
        status: 'draft'
      };
      
      const response = await formAPI.createForm(backendFormData);
      
      if (response.success) {
        // Transform backend response to frontend format
        // Handle both possible response formats
        const formData = response.data || response.form;
        const newForm = {
          id: formData._id,
          name: formData.title,
          title: formData.title,
          fields: formData.fields || [],
          pages: [{ id: 'page-1', name: 'Page 1', fields: formData.fields || [] }],
          status: formData.status,
          visibility: 'private',
          responses: formData.responses || [],
          createdAt: formData.createdAt,
          updatedAt: formData.updatedAt,
          location: 'inbox',
          views: formData.views || 0,
          createdBy: formData.createdBy
        };
        
        setForms(prev => [...prev, newForm]);
        setCurrentForm(newForm);
        
        return newForm;
      } else {
        throw new Error(response.message || 'Failed to create form');
      }
    } catch (error) {
      console.error('Failed to create form:', error);
      // Fallback to local creation
      const newForm = {
        id: uuidv4(),
        name: formData.name || 'Untitled Form',
        fields: [],
        pages: [{ id: 'page-1', name: 'Page 1', fields: [] }],
        status: 'draft',
        visibility: 'private',
        responses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        location: 'inbox'
      };
      
      setForms(prev => [...prev, newForm]);
      setCurrentForm(newForm);
      
      return newForm;
    }
  }, []);

  const updateForm = useCallback(async (formId, updates) => {
    try {
      // Get the current form data before updating
      const currentFormData = forms.find(f => f.id === formId) || currentForm;
      if (!currentFormData) return;
      
      // Create the updated form object with the merged data
      const updatedFormData = {
        ...currentFormData,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Update local state immediately for responsive UI
      setForms(prev => prev.map(form => 
        form.id === formId 
          ? updatedFormData
          : form
      ));
      if (currentForm && currentForm.id === formId) {
        setCurrentForm(updatedFormData);
      }

      // Prepare data for backend with the updated form data
      const backendData = {
        title: updatedFormData.name || updatedFormData.title,
        status: updatedFormData.status,
        pages: updatedFormData.pages || [],
        // Also include flat fields for backwards compatibility
        fields: updatedFormData.pages ? updatedFormData.pages.flatMap(page => page.fields || []) : []
      };

      // Only make API call if we have essential data
      if (backendData.title) {
        const response = await formAPI.updateForm(formId, backendData);
        if (response.success) {
          console.log('Form successfully saved to database with pages structure');
        } else {
          console.error('Failed to save form to database:', response.message);
        }
      }
    } catch (error) {
      console.error('Error updating form:', error);
      // Don't revert local changes - keep the optimistic update
      // This ensures the UI remains responsive even if backend fails
    }
  }, [currentForm, forms]);

  const deleteForm = useCallback((formId) => {
    setForms(prev => prev.filter(form => form.id !== formId));
    // Also remove related conditions
    setFieldConditions(prev => prev.filter(condition => condition.formId !== formId));
    setPageConditions(prev => prev.filter(condition => condition.formId !== formId));
    if (currentForm && currentForm.id === formId) {
      setCurrentForm(null);
    }
  }, [currentForm]);

  const moveFormToTrash = useCallback((formId) => {
    updateForm(formId, { location: 'trash' });
  }, [updateForm]);

  const moveFormToArchive = useCallback((formId) => {
    updateForm(formId, { location: 'archive' });
  }, [updateForm]);

  const restoreForm = useCallback((formId) => {
    updateForm(formId, { location: 'inbox' });
  }, [updateForm]);

  const addField = useCallback(async (formId, pageId, field) => {
    console.log('🔸 Adding field to form:', formId, 'page:', pageId, 'field:', field.type);
    
    const newField = {
      id: uuidv4(),
      ...field,
      createdAt: new Date().toISOString()
    };
    
    // Get current form data before updating
    const currentFormData = forms.find(f => f.id === formId) || currentForm;
    if (!currentFormData) {
      console.error('❌ Form not found:', formId);
      return;
    }
    
    console.log('🔸 Current form pages before update:', currentFormData.pages.length);
    
    // Update local state immediately for responsive UI
    const updatedFormData = {
      ...currentFormData,
      pages: currentFormData.pages.map(page => 
        page.id === pageId 
          ? { 
              ...page, 
              fields: [...page.fields, newField]
            }
          : page
      ),
      updatedAt: new Date().toISOString()
    };
    
    console.log('🔸 Updated form pages after adding field:', updatedFormData.pages.map(p => ({ id: p.id, fields: p.fields.length })));
    
    // Update both forms array and currentForm
    setForms(prev => prev.map(form => 
      form.id === formId ? updatedFormData : form
    ));
    
    if (currentForm && currentForm.id === formId) {
      setCurrentForm(updatedFormData);
    }
    
    // Save to backend automatically
    try {
      const backendData = {
        title: updatedFormData.name || updatedFormData.title,
        status: updatedFormData.status,
        pages: updatedFormData.pages || [],
        fields: updatedFormData.pages ? updatedFormData.pages.flatMap(page => page.fields || []) : []
      };
      
      console.log('🔸 Saving to backend - total fields:', backendData.fields.length, 'pages:', backendData.pages.length);
      const response = await formAPI.updateForm(formId, backendData);
      
      if (response.success) {
        console.log('✅ Field added and saved to database successfully');
      } else {
        console.error('❌ Failed to save field to database:', response.message);
      }
    } catch (error) {
      console.error('❌ Error saving field to database:', error);
    }
  }, [currentForm, forms]);

  const updateField = useCallback(async (formId, pageId, fieldId, updates) => {
    // Update local state immediately for responsive UI
    const updatedForms = forms.map(form => 
      form.id === formId 
        ? {
            ...form,
            pages: form.pages.map(page => 
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
            ),
            updatedAt: new Date().toISOString()
          }
        : form
    );
    
    setForms(updatedForms);
    
    let updatedCurrentForm = null;
    if (currentForm && currentForm.id === formId) {
      updatedCurrentForm = {
        ...currentForm,
        pages: currentForm.pages.map(page => 
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
        ),
        updatedAt: new Date().toISOString()
      };
      setCurrentForm(updatedCurrentForm);
    }
    
    // Save to backend automatically
    try {
      const formToSave = updatedForms.find(f => f.id === formId) || updatedCurrentForm;
      if (formToSave) {
        const backendData = {
          title: formToSave.name || formToSave.title,
          status: formToSave.status,
          pages: formToSave.pages || [],
          fields: formToSave.pages ? formToSave.pages.flatMap(page => page.fields || []) : []
        };
        
        await formAPI.updateForm(formId, backendData);
        console.log('Field updated and saved to database');
      }
    } catch (error) {
      console.error('Error saving updated field to database:', error);
    }
  }, [currentForm, forms]);

  const removeField = useCallback(async (formId, pageId, fieldId) => {
    // Remove related conditions when field is deleted
    setFieldConditions(prev => prev.filter(condition => 
      condition.triggerFieldId !== fieldId && condition.targetFieldId !== fieldId
    ));
    setPageConditions(prev => prev.filter(condition => 
      condition.triggerFieldId !== fieldId
    ));
    
    // Update local state immediately for responsive UI
    const updatedForms = forms.map(form => 
      form.id === formId 
        ? {
            ...form,
            pages: form.pages.map(page => 
              page.id === pageId 
                ? { ...page, fields: page.fields.filter(field => field.id !== fieldId) }
                : page
            ),
            updatedAt: new Date().toISOString()
          }
        : form
    );
    
    setForms(updatedForms);
    
    let updatedCurrentForm = null;
    if (currentForm && currentForm.id === formId) {
      updatedCurrentForm = {
        ...currentForm,
        pages: currentForm.pages.map(page => 
          page.id === pageId 
            ? { ...page, fields: page.fields.filter(field => field.id !== fieldId) }
            : page
        ),
        updatedAt: new Date().toISOString()
      };
      setCurrentForm(updatedCurrentForm);
    }
    
    // Save to backend automatically
    try {
      const formToSave = updatedForms.find(f => f.id === formId) || updatedCurrentForm;
      if (formToSave) {
        const backendData = {
          title: formToSave.name || formToSave.title,
          status: formToSave.status,
          pages: formToSave.pages || [],
          fields: formToSave.pages ? formToSave.pages.flatMap(page => page.fields || []) : []
        };
        
        await formAPI.updateForm(formId, backendData);
        console.log('Field removed and saved to database');
      }
    } catch (error) {
      console.error('Error saving removed field to database:', error);
    }
  }, [currentForm, forms]);

  const addFormPage = useCallback((formId) => {
    const form = forms.find(f => f.id === formId);
    if (!form || form.pages.length >= MAX_PAGES) return;
    
    const newPage = {
      id: uuidv4(),
      name: `Page ${form.pages.length + 1}`,
      fields: []
    };
    
    updateForm(formId, {
      pages: [...form.pages, newPage]
    });
  }, [forms, updateForm]);

  const deleteFormPage = useCallback((formId, pageIndex) => {
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
    updateForm(formId, {
      pages: newPages
    });
  }, [forms, updateForm]);

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

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    forms,
    currentForm,
    setCurrentForm,
    fieldConditions,
    pageConditions,
    chatbotSettings,
    setChatbotSettings,
    isLoadingForms,
    loadForms,
    createForm,
    updateForm,
    deleteForm,
    moveFormToTrash,
    moveFormToArchive,
    restoreForm,
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
  }), [
    forms,
    currentForm,
    fieldConditions,
    pageConditions,
    chatbotSettings,
    setChatbotSettings,
    isLoadingForms,
    loadForms,
    createForm,
    updateForm,
    deleteForm,
    moveFormToTrash,
    moveFormToArchive,
    restoreForm,
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