import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from '../contexts/FormContext';
import { evaluateCondition, getVisibleFields, getNextPageIndex, getVisiblePages } from '../utils/conditionalLogic';
import Navbar from '../components/Navbar';
import { ArrowLeft, Send, Upload, Star } from 'lucide-react';

const FormPreview = () => {
  const { formId } = useParams();
  const { forms, updateForm, fieldConditions, pageConditions } = useForm();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [errors, setErrors] = useState({});

  const form = forms.find(f => f.id === formId);

  // Get all fields with page information for conditional logic
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

  const allFields = getAllFields();
  const formFieldConditions = fieldConditions.filter(c => c.formId === formId);
  const formPageConditions = pageConditions.filter(c => c.formId === formId);

  // Get visible pages based on conditions
  const visiblePageIds = getVisiblePages(form?.pages || [], formPageConditions, formData, allFields);
  const visiblePages = form?.pages?.filter(page => visiblePageIds.includes(page.id)) || [];

  useEffect(() => {
    if (form) {
      // Initialize form data
      const initialData = {};
      form.pages.forEach(page => {
        page.fields.forEach(field => {
          if (field.type === 'checkbox') {
            initialData[field.id] = [];
          } else if (field.type === 'address') {
            field.subfields?.forEach(subfield => {
              initialData[`${field.id}_${subfield.name}`] = '';
            });
          } else {
            initialData[field.id] = '';
          }
        });
      });
      setFormData(initialData);
    }
  }, [form]);

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: null
      }));
    }
  };

  const validateField = (field) => {
    const value = formData[field.id];

    // Required field validation
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return `${field.label} is required`;
    }

    // Basic type validations
    if (value && typeof value === 'string') {
      // Email validation
      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
      }
      
      // Phone validation
      if (field.type === 'phone') {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(value) || value.length < 10) {
          return 'Please enter a valid phone number';
        }
      }
    }
    
    // Number validation
    if (field.type === 'number' && value) {
      if (isNaN(value)) {
        return `${field.label} must be a number`;
      }
    }

    return null;
  };

  const validateCurrentPage = () => {
    const currentPage = visiblePages[currentPageIndex];
    if (!currentPage) return true;

    const pageErrors = {};
    let hasErrors = false;

    // Get visible fields for current page
    const visibleFieldIds = getVisibleFields(currentPage.fields, formFieldConditions, formData, allFields);
    const visibleFields = currentPage.fields.filter(field => visibleFieldIds.includes(field.id));

    visibleFields.forEach(field => {
      const error = validateField(field);
      if (error) {
        pageErrors[field.id] = error;
        hasErrors = true;
      }
      
      // Validate address subfields
      if (field.type === 'address') {
        field.subfields?.forEach(subfield => {
          const subfieldValue = formData[`${field.id}_${subfield.name}`];
          if (subfield.required && !subfieldValue) {
            pageErrors[`${field.id}_${subfield.name}`] = `${subfield.label} is required`;
            hasErrors = true;
          }
        });
      }
    });

    setErrors(pageErrors);
    return !hasErrors;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateCurrentPage()) {
      // Use conditional logic to determine next page
      const nextIndex = getNextPageIndex(currentPageIndex, visiblePages, formPageConditions, formData, allFields);
      setCurrentPageIndex(nextIndex);
    }
  };

  const handlePrevious = (e) => {
    e.preventDefault();
    setCurrentPageIndex(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateCurrentPage()) {
      // Create a new response
      const newResponse = {
        id: Date.now().toString(),
        submittedAt: new Date().toISOString(),
        data: formData
      };

      // Add response to form
      const updatedForm = {
        ...form,
        responses: [...(form.responses || []), newResponse]
      };

      updateForm(form.id, updatedForm);

      // Navigate to responses page
      navigate(`/form-responses/${form.id}`);
    }
  };

  const renderField = (field) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={option}
                  checked={value.includes(option)}
                  onChange={(e) => {
                    const newValue = e.target.checked
                      ? [...value, option]
                      : value.filter(v => v !== option);
                    handleInputChange(field.id, newValue);
                  }}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        );
      
      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        );
      
      case 'file':
        return (
          <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-purple-400'
          }`}>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                handleInputChange(field.id, file ? file.name : '');
              }}
              className="hidden"
              id={`file-${field.id}`}
            />
            <label htmlFor={`file-${field.id}`} className="cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">
                {value ? `Selected: ${value}` : 'Click to upload files'}
              </p>
            </label>
          </div>
        );
      
      case 'rating':
        return (
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Star
                key={rating}
                onClick={() => handleInputChange(field.id, rating)}
                className={`w-8 h-8 cursor-pointer transition-colors ${
                  rating <= (value || 0) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
              />
            ))}
          </div>
        );
      
      case 'address':
        return (
          <div className="space-y-4">
            {field.subfields?.map((subfield, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {subfield.label} {subfield.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={formData[`${field.id}_${subfield.name}`] || ''}
                  onChange={(e) => handleInputChange(`${field.id}_${subfield.name}`, e.target.value)}
                  placeholder={`Enter ${subfield.label.toLowerCase()}`}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors[`${field.id}_${subfield.name}`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors[`${field.id}_${subfield.name}`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`${field.id}_${subfield.name}`]}</p>
                )}
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        );
    }
  };

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
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

  if (visiblePages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{form.name}</h1>
              <p className="text-gray-600 mb-8">No pages are currently visible based on your conditions.</p>
              <Link
                to={`/form-builder/${form.id}`}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Edit Form
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPage = visiblePages[currentPageIndex];
  const isLastPage = currentPageIndex === visiblePages.length - 1;

  // Get visible fields for current page
  const visibleFieldIds = getVisibleFields(currentPage.fields, formFieldConditions, formData, allFields);
  const visibleFields = currentPage.fields.filter(field => visibleFieldIds.includes(field.id));

  if (visibleFields.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{form.name}</h1>
              <p className="text-gray-600 mb-8">No fields are visible on this page based on your responses.</p>
              <div className="flex justify-between">
                {currentPageIndex > 0 ? (
                  <button
                    onClick={handlePrevious}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                ) : (
                  <div></div>
                )}
                {!isLastPage ? (
                  <button
                    onClick={handleNext}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Form</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to={`/form-builder/${form.id}`}
            className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Form Builder
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.name}</h1>
            {visiblePages.length > 1 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Page {currentPageIndex + 1} of {visiblePages.length}</span>
                  <span>{currentPage.name}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentPageIndex + 1) / visiblePages.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {visibleFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.description && (
                  <p className="text-sm text-gray-500 mb-2">{field.description}</p>
                )}
                {renderField(field)}
                {errors[field.id] && (
                  <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>
                )}
              </div>
            ))}

            <div className="flex justify-between pt-6">
              {currentPageIndex > 0 ? (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
              ) : (
                <div></div>
              )}

              {isLastPage ? (
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Form</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;