import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formAPI } from '../services/api';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const PublicForm = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load the public form
  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true);
        const result = await formAPI.getPublicForm(formId);
        
        if (result.success) {
          setForm(result.data);
          
          // Initialize form data with default values
          const initialData = {};
          result.data.pages.forEach(page => {
            page.fields.forEach(field => {
              if (field.type === 'checkbox') {
                initialData[field.id] = [];
              } else if (field.type === 'address') {
                field.subfields?.forEach(subfield => {
                  initialData[`${field.id}_${subfield.name}`] = '';
                });
              } else {
                initialData[field.id] = field.defaultValue || '';
              }
            });
          });
          setFormData(initialData);
        }
      } catch (error) {
        console.error('Error loading public form:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (formId) {
      loadForm();
    }
  }, [formId]);

  const validateField = (field, value) => {
    const fieldErrors = [];

    // Required field validation
    if (field.required) {
      if (field.type === 'checkbox') {
        if (!value || value.length === 0) {
          fieldErrors.push(`${field.label} is required`);
        }
      } else if (!value || (typeof value === 'string' && value.trim() === '')) {
        fieldErrors.push(`${field.label} is required`);
      }
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        fieldErrors.push(`Please enter a valid email address`);
      }
    }

    // Phone validation
    if (field.type === 'phone' && value) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(value) || value.length < 10) {
        fieldErrors.push(`Please enter a valid phone number`);
      }
    }

    // Number validation
    if (field.type === 'number' && value) {
      if (isNaN(value)) {
        fieldErrors.push(`${field.label} must be a number`);
      }
      if (field.min !== undefined && Number(value) < field.min) {
        fieldErrors.push(`${field.label} must be at least ${field.min}`);
      }
      if (field.max !== undefined && Number(value) > field.max) {
        fieldErrors.push(`${field.label} must be at most ${field.max}`);
      }
    }

    return fieldErrors;
  };

  const validateCurrentPage = () => {
    if (!form || !form.pages[currentPage]) return true;

    const currentPageData = form.pages[currentPage];
    const pageErrors = {};
    let hasErrors = false;

    currentPageData.fields.forEach(field => {
      let value;
      if (field.type === 'address') {
        // For address fields, check all subfields
        const addressValues = {};
        field.subfields?.forEach(subfield => {
          addressValues[subfield.name] = formData[`${field.id}_${subfield.name}`];
        });
        
        // Check if any required subfields are missing
        if (field.required) {
          const requiredSubfields = field.subfields?.filter(sf => sf.required) || [];
          requiredSubfields.forEach(subfield => {
            if (!addressValues[subfield.name] || addressValues[subfield.name].trim() === '') {
              pageErrors[`${field.id}_${subfield.name}`] = [`${subfield.label} is required`];
              hasErrors = true;
            }
          });
        }
      } else {
        value = formData[field.id];
        const fieldErrors = validateField(field, value);
        if (fieldErrors.length > 0) {
          pageErrors[field.id] = fieldErrors;
          hasErrors = true;
        }
      }
    });

    setErrors(pageErrors);
    return !hasErrors;
  };

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: null
      }));
    }
  };

  const handleNext = () => {
    if (validateCurrentPage()) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentPage(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateCurrentPage()) return;

    setIsSubmitting(true);
    try {
      const result = await formAPI.submitFormResponse(formId, {
        data: formData,
        submittedAt: new Date().toISOString()
      });

      if (result.success) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const fieldValue = formData[field.id] || '';
    const fieldError = errors[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              value={fieldValue}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                fieldError ? 'border-red-500' : 'border-gray-300'
              }`}
              required={field.required}
            />
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={fieldValue}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                fieldError ? 'border-red-500' : 'border-gray-300'
              }`}
              required={field.required}
            />
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={fieldValue}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                fieldError ? 'border-red-500' : 'border-gray-300'
              }`}
              required={field.required}
            />
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={fieldValue}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                fieldError ? 'border-red-500' : 'border-gray-300'
              }`}
              required={field.required}
            >
              <option value="">Select an option</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={fieldValue === option}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option}
                    checked={(fieldValue || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = fieldValue || [];
                      let newValues;
                      if (e.target.checked) {
                        newValues = [...currentValues, option];
                      } else {
                        newValues = currentValues.filter(v => v !== option);
                      }
                      handleInputChange(field.id, newValues);
                    }}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={fieldValue}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                fieldError ? 'border-red-500' : 'border-gray-300'
              }`}
              required={field.required}
            />
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case 'time':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="time"
              value={fieldValue}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                fieldError ? 'border-red-500' : 'border-gray-300'
              }`}
              required={field.required}
            />
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case 'rating':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex space-x-2">
              {Array.from({ length: field.maxRating || 5 }, (_, i) => i + 1).map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleInputChange(field.id, rating)}
                  className={`w-10 h-10 rounded-full border-2 transition-colors ${
                    fieldValue >= rating
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-gray-300 text-gray-400 hover:border-purple-300'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case 'address':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field.subfields?.map((subfield) => {
                const subfieldKey = `${field.id}_${subfield.name}`;
                const subfieldValue = formData[subfieldKey] || '';
                const subfieldError = errors[subfieldKey];
                
                return (
                  <div key={subfield.name}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {subfield.label}
                      {subfield.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      value={subfieldValue}
                      onChange={(e) => handleInputChange(subfieldKey, e.target.value)}
                      placeholder={subfield.placeholder}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        subfieldError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required={subfield.required}
                    />
                    {subfieldError && (
                      <p className="mt-1 text-xs text-red-600">{subfieldError[0]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading form...</h3>
          <p className="text-gray-600">Please wait while we prepare the form for you.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Form not found</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Thank you!</h3>
          <p className="text-gray-600 mb-6">Your response has been submitted successfully.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!form || !form.pages || form.pages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid form</h3>
          <p className="text-gray-600">This form appears to be empty or invalid.</p>
        </div>
      </div>
    );
  }

  const currentPageData = form.pages[currentPage];
  const isLastPage = currentPage === form.pages.length - 1;
  const isFirstPage = currentPage === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Form Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.name}</h1>
          {form.description && (
            <p className="text-gray-600">{form.description}</p>
          )}
          
          {/* Progress Bar */}
          {form.pages.length > 1 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Page {currentPage + 1} of {form.pages.length}</span>
                <span>{Math.round(((currentPage + 1) / form.pages.length) * 100)}% complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentPage + 1) / form.pages.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Page Title */}
          {currentPageData.title && (
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentPageData.title}
            </h2>
          )}
          
          {/* Page Description */}
          {currentPageData.description && (
            <p className="text-gray-600 mb-6">
              {currentPageData.description}
            </p>
          )}

          {/* Form Fields */}
          <div>
            {currentPageData.fields.map((field) => renderField(field))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div>
              {!isFirstPage && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              )}
            </div>
            
            <div>
              {isLastPage ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Submit</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicForm;
