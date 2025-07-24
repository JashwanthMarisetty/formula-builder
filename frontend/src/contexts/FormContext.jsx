import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

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

  const createForm = (formData) => {
    const newForm = {
      id: uuidv4(),
      name: formData.name || 'Untitled Form',
      description: formData.description || '',
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
  };

  const updateForm = (formId, updates) => {
    setForms(prev => prev.map(form => 
      form.id === formId 
        ? { ...form, ...updates, updatedAt: new Date().toISOString() }
        : form
    ));
    if (currentForm && currentForm.id === formId) {
      setCurrentForm(prev => ({ ...prev, ...updates }));
    }
  };

  const deleteForm = (formId) => {
    setForms(prev => prev.filter(form => form.id !== formId));
    // Also remove related conditions
    setFieldConditions(prev => prev.filter(condition => condition.formId !== formId));
    setPageConditions(prev => prev.filter(condition => condition.formId !== formId));
    if (currentForm && currentForm.id === formId) {
      setCurrentForm(null);
    }
  };

  const moveFormToTrash = (formId) => {
    updateForm(formId, { location: 'trash' });
  };

  const moveFormToArchive = (formId) => {
    updateForm(formId, { location: 'archive' });
  };

  const restoreForm = (formId) => {
    updateForm(formId, { location: 'inbox' });
  };

  const addField = (formId, pageId, field) => {
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
  };

  const updateField = (formId, pageId, fieldId, updates) => {
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
  };

  const removeField = (formId, pageId, fieldId) => {
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
  };

  const addFormPage = (formId) => {
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
  };

  const deleteFormPage = (formId, pageIndex) => {
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
  };

  const addFieldCondition = (condition) => {
    const newCondition = {
      id: uuidv4(),
      ...condition
    };
    setFieldConditions(prev => [...prev, newCondition]);
  };

  const removeFieldCondition = (id) => {
    setFieldConditions(prev => prev.filter(condition => condition.id !== id));
  };

  const addPageCondition = (condition) => {
    const newCondition = {
      id: uuidv4(),
      ...condition
    };
    setPageConditions(prev => [...prev, newCondition]);
  };

  const removePageCondition = (id) => {
    setPageConditions(prev => prev.filter(condition => condition.id !== id));
  };

  const updateFieldCondition = (id, updates) => {
    setFieldConditions(prev => prev.map(condition =>
      condition.id === id ? { ...condition, ...updates } : condition
    ));
  };

  const updatePageCondition = (id, updates) => {
    setPageConditions(prev => prev.map(condition =>
      condition.id === id ? { ...condition, ...updates } : condition
    ));
  };

  const value = {
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
  };

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
};