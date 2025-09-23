import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { formAPI } from '../services/api';
import { useAuth } from './AuthContext';

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

  // Simple form loading from backend
  const loadForms = useCallback(async () => {
    const token = localStorage.getItem('formula_token');
    if (!token) return;

    try {
      setIsLoadingForms(true);
      const response = await formAPI.getAllForms({ limit: 100 });
      
      if (response.success) {
        // Transform backend data to ensure consistent ID handling
        const formsArray = (response.data?.forms || []).map(form => ({
          ...form,
          id: form._id, // Ensure each form has both _id and id properties
          name: form.title || form.name, // Ensure both name and title are available
          title: form.title || form.name
        }));
        setForms(formsArray);
      }
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setIsLoadingForms(false);
    }
  }, []);

  // Load forms when authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadForms();
    } else if (!isLoading && !isAuthenticated) {
      setForms([]);
      setCurrentForm(null);
    }
  }, [isAuthenticated, isLoading, loadForms]);

  // Simplified form operations - let backend handle everything
  const createForm = useCallback(async (formData) => {
    try {
      const response = await formAPI.createForm({
        title: formData.title || formData.name || 'Untitled Form'
      });
      
      if (response.success) {
        await loadForms(); // Refresh form list
        return {
          id: response.data._id,
          ...response.data,
          name: response.data.title || response.data.name, // Ensure both name and title are available
          title: response.data.title || response.data.name
        };
      }
    } catch (error) {
      console.error('Failed to create form:', error);
      throw error;
    }
  }, [loadForms]);

  // Simple form refetch
  const refetchCurrentForm = useCallback(async (formId) => {
    try {
      const response = await formAPI.getFormById(formId);
      if (response.success) {
        const updatedForm = {
          id: response.data._id,
          ...response.data,
          name: response.data.title || response.data.name, // Ensure both name and title are available
          title: response.data.title || response.data.name
        };
        setCurrentForm(updatedForm);
        // Also update in forms list
        setForms(prev => prev.map(form => 
          (form._id === formId || form.id === formId) ? updatedForm : form
        ));
      }
    } catch (error) {
      console.error('Failed to refetch form:', error);
    }
  }, []);

  // Simplified field operations - backend generates IDs
  const addField = useCallback(async (formId, pageId, fieldData) => {
    try {
      await formAPI.addFieldToPage(formId, pageId, fieldData);
      await refetchCurrentForm(formId);
    } catch (error) {
      console.error('Failed to add field:', error);
      throw error;
    }
  }, [refetchCurrentForm]);

  const updateField = useCallback(async (formId, fieldId, updates) => {
    try {
      await formAPI.updateFieldById(formId, fieldId, updates);
      await refetchCurrentForm(formId);
    } catch (error) {
      console.error('Failed to update field:', error);
      throw error;
    }
  }, [refetchCurrentForm]);

  const removeField = useCallback(async (formId, fieldId) => {
    try {
      await formAPI.deleteFieldById(formId, fieldId);
      await refetchCurrentForm(formId);
    } catch (error) {
      console.error('Failed to remove field:', error);
      throw error;
    }
  }, [refetchCurrentForm]);

  // Simplified page operations
  const addFormPage = useCallback(async (formId, pageName) => {
    try {
      await formAPI.addPageToForm(formId, { name: pageName });
      await refetchCurrentForm(formId);
    } catch (error) {
      console.error('Failed to add page:', error);
      throw error;
    }
  }, [refetchCurrentForm]);

  const deleteFormPage = useCallback(async (formId, pageId) => {
    try {
      await formAPI.deletePageById(formId, pageId);
      await refetchCurrentForm(formId);
    } catch (error) {
      console.error('Failed to delete page:', error);
      throw error;
    }
  }, [refetchCurrentForm]);

  // Simple form update
  const updateForm = useCallback(async (formId, updates) => {
    try {
      await formAPI.updateForm(formId, updates);
      await refetchCurrentForm(formId);
    } catch (error) {
      console.error('Failed to update form:', error);
      throw error;
    }
  }, [refetchCurrentForm]);

  // Simple form deletion
  const deleteForm = useCallback(async (formId) => {
    try {
      await formAPI.deleteForm(formId);
      await loadForms(); // Refresh form list
      if (currentForm && currentForm.id === formId) {
        setCurrentForm(null);
      }
    } catch (error) {
      console.error('Failed to delete form:', error);
      throw error;
    }
  }, [currentForm, loadForms]);

  // Form status operations
  const moveFormToTrash = useCallback((formId) => {
    updateForm(formId, { location: 'trash' });
  }, [updateForm]);

  const moveFormToArchive = useCallback((formId) => {
    updateForm(formId, { location: 'archive' });
  }, [updateForm]);

  const restoreForm = useCallback((formId) => {
    updateForm(formId, { location: 'inbox' });
  }, [updateForm]);

  // Conditional logic operations - now stored in backend
  const addFieldCondition = useCallback(async (formId, condition) => {
    try {
      await formAPI.addConditionalRule(formId, condition);
      await refetchCurrentForm(formId);
    } catch (error) {
      console.error('Failed to add conditional rule:', error);
      throw error;
    }
  }, [refetchCurrentForm]);

  const removeFieldCondition = useCallback(async (formId, ruleId) => {
    try {
      await formAPI.deleteConditionalRule(formId, ruleId);
      await refetchCurrentForm(formId);
    } catch (error) {
      console.error('Failed to remove conditional rule:', error);
      throw error;
    }
  }, [refetchCurrentForm]);

  const getConditionalRules = useCallback(async (formId) => {
    try {
      const response = await formAPI.getConditionalRules(formId);
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Failed to get conditional rules:', error);
      return [];
    }
  }, []);

  // Context value
  const value = useMemo(() => ({
    // State
    forms,
    currentForm,
    setCurrentForm,
    isLoadingForms,
    
    // Form operations
    loadForms,
    createForm,
    updateForm,
    deleteForm,
    moveFormToTrash,
    moveFormToArchive,
    restoreForm,
    
    // Field operations
    addField,
    updateField,
    removeField,
    
    // Page operations
    addFormPage,
    deleteFormPage,
    
    // Conditional logic operations
    addFieldCondition,
    removeFieldCondition,
    getConditionalRules,
    
    // Utility
    refetchCurrentForm
  }), [
    forms,
    currentForm,
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
    getConditionalRules,
    refetchCurrentForm
  ]);

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
};
