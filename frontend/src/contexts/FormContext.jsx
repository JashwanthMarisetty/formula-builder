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

  useEffect(() => {
    // Load forms from localStorage
    const savedForms = localStorage.getItem('formula_forms');
    if (savedForms) {
      setForms(JSON.parse(savedForms));
    }
    
    // Load conditions from localStorage
    const savedFieldConditions = localStorage.getItem('formula_field_conditions');
    if (savedFieldConditions) {
      setFieldConditions(JSON.parse(savedFieldConditions));
    }
    
    const savedPageConditions = localStorage.getItem('formula_page_conditions');
    if (savedPageConditions) {
      setPageConditions(JSON.parse(savedPageConditions));
    }
  }, []);

  useEffect(() => {
    // Save forms to localStorage whenever forms change
    localStorage.setItem('formula_forms', JSON.stringify(forms));
  }, [forms]);

  useEffect(() => {
    // Save conditions to localStorage
    localStorage.setItem('formula_field_conditions', JSON.stringify(fieldConditions));
  }, [fieldConditions]);

  useEffect(() => {
    localStorage.setItem('formula_page_conditions', JSON.stringify(pageConditions));
  }, [pageConditions]);

  const createForm = useCallback((formData) => {
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
    
    setForms(prev => {
      return [...prev, newForm];
    });
    
    setCurrentForm(newForm);
    
    return newForm;
  }, []);

  const updateForm = useCallback((formId, updates) => {
    setForms(prev => prev.map(form => 
      form.id === formId 
        ? { ...form, ...updates, updatedAt: new Date().toISOString() }
        : form
    ));
    if (currentForm && currentForm.id === formId) {
      setCurrentForm(prev => ({ ...prev, ...updates }));
    }
  }, [currentForm]);

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

  const addField = useCallback((formId, pageId, field) => {
    const newField = {
      id: uuidv4(),
      ...field,
      createdAt: new Date().toISOString()
    };
    
    setForms(prev => prev.map(form => 
      form.id === formId 
        ? {
            ...form,
            pages: form.pages.map(page => 
              page.id === pageId 
                ? { ...page, fields: [...page.fields, newField] }
                : page
            ),
            updatedAt: new Date().toISOString()
          }
        : form
    ));
    
    if (currentForm && currentForm.id === formId) {
      setCurrentForm(prev => ({
        ...prev,
        pages: prev.pages.map(page => 
          page.id === pageId 
            ? { ...page, fields: [...page.fields, newField] }
            : page
        )
      }));
    }
  }, [currentForm]);

  const updateField = useCallback((formId, pageId, fieldId, updates) => {
    setForms(prev => prev.map(form => 
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
    ));
    
    if (currentForm && currentForm.id === formId) {
      setCurrentForm(prev => ({
        ...prev,
        pages: prev.pages.map(page => 
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
        )
      }));
    }
  }, [currentForm]);

  const removeField = useCallback((formId, pageId, fieldId) => {
    // Remove related conditions when field is deleted
    setFieldConditions(prev => prev.filter(condition => 
      condition.triggerFieldId !== fieldId && condition.targetFieldId !== fieldId
    ));
    setPageConditions(prev => prev.filter(condition => 
      condition.triggerFieldId !== fieldId
    ));
    
    setForms(prev => prev.map(form => 
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
    ));
    
    if (currentForm && currentForm.id === formId) {
      setCurrentForm(prev => ({
        ...prev,
        pages: prev.pages.map(page => 
          page.id === pageId 
            ? { ...page, fields: page.fields.filter(field => field.id !== fieldId) }
            : page
        )
      }));
    }
  }, [currentForm]);

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