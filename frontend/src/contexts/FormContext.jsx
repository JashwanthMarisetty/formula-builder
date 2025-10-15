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
            location: form.location || 'inbox',
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
    
  }, [loadForms]);

  useEffect(() => {
    // Keep localStorage as backup (will be removed later)
    localStorage.setItem('formula_forms', JSON.stringify(forms));
  }, [forms]);


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
          location: formData.location || 'inbox',
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
        location: updatedFormData.location,
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
    }
  }, [currentForm, forms]);

  const deleteForm = useCallback(async (formId) => {
    try {
      await formAPI.deleteForm(formId);
      setForms(prev => prev.filter(form => form.id !== formId));
      if (currentForm && currentForm.id === formId) {
        setCurrentForm(null);
      }
    } catch (error) {
      console.error('Failed to delete form from server:', error);
      throw error;
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
    
    const newPages = form.pages.filter((_, index) => index !== pageIndex);
    updateForm(formId, {
      pages: newPages
    });
  }, [forms, updateForm]);


  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    forms,
    currentForm,
    setCurrentForm,
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
    deleteFormPage
  }), [
    forms,
    currentForm,
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
    deleteFormPage
  ]);

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
};