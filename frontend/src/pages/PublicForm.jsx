import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formAPI } from "../services/api";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import GoogleMap from "../components/GoogleMap";

const PublicForm = () => {
  // --- Conditional logic helpers (frontend) ---
  const evalCondition = (cond, data) => {
    const left = data?.[cond.field];
    const right = cond.value;
    switch (cond.op) {
      case "eq":
        return left === right;
      case "neq":
        return left !== right;
      case "gt":
        return Number(left) > Number(right);
      case "lt":
        return Number(left) < Number(right);
      case "contains":
        if (Array.isArray(left)) return left.includes(right);
        if (typeof left === "string")
          return left.toLowerCase().includes(String(right).toLowerCase());
        return false;
      case "in":
        if (Array.isArray(right)) return right.includes(left);
        return false;
      default:
        return false;
    }
  };
  const evalWhenArray = (whenArr = [], data) =>
    whenArr.every((c) => evalCondition(c, data));
  const isFieldVisible = (field, data) => {
    const rules = Array.isArray(field.visibilityRules)
      ? field.visibilityRules
      : [];
    if (rules.length === 0) return true;
    for (const rule of rules) {
      if (evalWhenArray(rule.when || [], data)) {
        const action = rule.action || "show";
        return action === "show";
      }
    }
    return true;
  };
  const getVisibleFieldsForPage = (page, data) =>
    (page?.fields || []).filter((f) => isFieldVisible(f, data));
  const getNextPageIndex = (formObj, currentIndex, data) => {
    const pages = formObj?.pages || [];
    const page = pages[currentIndex];
    if (!page) return currentIndex;
    const logic = page.logic || {};
    const skipRules = Array.isArray(logic.skipTo) ? logic.skipTo : [];
    for (const rule of skipRules) {
      if (evalWhenArray(rule.when || [], data)) {
        const idx = pages.findIndex((p) => p.id === rule.toPageId);
        if (idx >= 0) return idx;
      }
    }
    return Math.min(currentIndex + 1, pages.length - 1);
  };
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
  const [respondentEmail, setRespondentEmail] = useState("");

  // Load the public form and track a view
  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true);
        const result = await formAPI.getPublicForm(formId);

        if (result.success) {
          setForm(result.data);

          // Initialize form data with default values
          const initialData = {};
          result.data.pages.forEach((page) => {
            page.fields.forEach((field) => {
              if (field.type === "checkbox") {
                initialData[field.id] = [];
              } else if (field.type === "address") {
                field.subfields?.forEach((subfield) => {
                  initialData[`${field.id}_${subfield.name}`] = "";
                });
              } else if (field.type === "location") {
                initialData[field.id] = null;
              } else {
                initialData[field.id] = field.defaultValue || "";
              }
            });
          });
          setFormData(initialData);

          // Track a view for this public form (IP will be captured on the server)
          try {
            await formAPI.trackFormView(formId);
          } catch (viewError) {
            // View tracking failure should not block the form
            console.warn("View tracking failed:", viewError?.message || viewError);
          }
        }
      } catch (error) {
        console.error("Error loading public form:", error);
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
      if (field.type === "checkbox") {
        if (!value || value.length === 0) {
          fieldErrors.push(`${field.label} is required`);
        }
      } else if (field.type === "location") {
        if (!value || !value.lat || !value.lng) {
          fieldErrors.push(`${field.label} is required`);
        }
      } else if (!value || (typeof value === "string" && value.trim() === "")) {
        fieldErrors.push(`${field.label} is required`);
      }
    }

    // Basic type validations
    if (value && typeof value === "string") {
      // Email validation
      if (field.type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          fieldErrors.push("Please enter a valid email address");
        }
      }

      // Phone validation
      if (field.type === "phone") {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(value) || value.length < 10) {
          fieldErrors.push("Please enter a valid phone number");
        }
      }
    }

    // Number validation
    if (field.type === "number" && value) {
      if (isNaN(value)) {
        fieldErrors.push(`${field.label} must be a number`);
      }
    }

    return fieldErrors;
  };

  const validateCurrentPage = () => {
    if (!form || !form.pages[currentPage]) return true;

    const currentPageData = form.pages[currentPage];
    const pageErrors = {};
    let hasErrors = false;

    const fieldsToCheck = getVisibleFieldsForPage(currentPageData, formData);
    fieldsToCheck.forEach((field) => {
      let value;
      if (field.type === "address") {
        // For address fields, check all subfields
        const addressValues = {};
        field.subfields?.forEach((subfield) => {
          addressValues[subfield.name] =
            formData[`${field.id}_${subfield.name}`];
        });

        // Check if any required subfields are missing
        if (field.required) {
          const requiredSubfields =
            field.subfields?.filter((sf) => sf.required) || [];
          requiredSubfields.forEach((subfield) => {
            if (
              !addressValues[subfield.name] ||
              addressValues[subfield.name].trim() === ""
            ) {
              pageErrors[`${field.id}_${subfield.name}`] = [
                `${subfield.label} is required`,
              ];
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
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear error for this field
    if (errors[fieldId]) {
      setErrors((prev) => ({
        ...prev,
        [fieldId]: null,
      }));
    }
  };

  const handleNext = () => {
    if (!validateCurrentPage()) return;
    const nextIdx = getNextPageIndex(form, currentPage, formData);
    setCurrentPage(nextIdx);
  };

  const handlePrevious = () => {
    setCurrentPage((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    // Validate current page fields
    if (!validateCurrentPage()) {
      return;
    }

    // Validate email - always required
    if (!respondentEmail || respondentEmail.trim() === "") {
      alert("Please enter your email address to receive a confirmation");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(respondentEmail.trim())) {
      alert("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await formAPI.submitFormResponse(formId, {
        data: formData,
        submittedAt: new Date().toISOString(),
        respondentEmail: respondentEmail.trim(),
      });

      if (result.success) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit form: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const fieldValue =
      field.type === "location"
        ? formData[field.id] || null
        : formData[field.id] || "";
    const fieldError = errors[field.id];

    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={
                field.type === "email"
                  ? "email"
                  : field.type === "phone"
                  ? "tel"
                  : "text"
              }
              value={fieldValue}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                fieldError ? "border-red-500" : "border-gray-300"
              }`}
              required={field.required}
            />
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case "textarea":
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
                fieldError ? "border-red-500" : "border-gray-300"
              }`}
              required={field.required}
            />
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case "number":
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                fieldError ? "border-red-500" : "border-gray-300"
              }`}
              required={field.required}
            />
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case "select":
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
                fieldError ? "border-red-500" : "border-gray-300"
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

      case "radio":
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
                    onChange={(e) =>
                      handleInputChange(field.id, e.target.value)
                    }
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

      case "checkbox":
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
                        newValues = currentValues.filter((v) => v !== option);
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

      case "date":
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
                fieldError ? "border-red-500" : "border-gray-300"
              }`}
              required={field.required}
            />
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case "time":
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
                fieldError ? "border-red-500" : "border-gray-300"
              }`}
              required={field.required}
            />
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );

      case "rating":
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex space-x-2">
              {Array.from(
                { length: field.maxRating || 5 },
                (_, i) => i + 1
              ).map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleInputChange(field.id, rating)}
                  className={`w-10 h-10 rounded-full border-2 transition-colors ${
                    fieldValue >= rating
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "border-gray-300 text-gray-400 hover:border-purple-300"
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

      case "address":
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field.subfields?.map((subfield) => {
                const subfieldKey = `${field.id}_${subfield.name}`;
                const subfieldValue = formData[subfieldKey] || "";
                const subfieldError = errors[subfieldKey];

                return (
                  <div key={subfield.name}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {subfield.label}
                      {subfield.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={subfieldValue}
                      onChange={(e) =>
                        handleInputChange(subfieldKey, e.target.value)
                      }
                      placeholder={subfield.placeholder}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        subfieldError ? "border-red-500" : "border-gray-300"
                      }`}
                      required={subfield.required}
                    />
                    {subfieldError && (
                      <p className="mt-1 text-xs text-red-600">
                        {subfieldError[0]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "location": {
        const handleLocationSelect = (location) => {
          function roundTo3(n) {
            return Number(n.toFixed(3));
          }
          const locationData = {
            lat: roundTo3(location.lat),
            lng: roundTo3(location.lng),
          };
          // Backend will enrich address/city on submit
          handleInputChange(field.id, locationData);
        };

        const handleResetLocation = () => {
          handleInputChange(field.id, null);
        };

        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="space-y-3">
              <GoogleMap
                onLocationSelect={handleLocationSelect}
                initialLocation={
                  fieldValue || { lat: 13.368309, lng: 78.571367 }
                }
                zoom={12}
                height="300px"
                showUseMyLocationButton={true}
                showCoordinates={false}
                isInteractive={true}
                className={fieldError ? "border-red-500" : ""}
              />

              {/* Reset Button */}
              {fieldValue && (
                <button
                  type="button"
                  onClick={handleResetLocation}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset Location</span>
                </button>
              )}

              {/* Display selected location */}
              {fieldValue && fieldValue.lat && fieldValue.lng && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex items-center space-x-2 text-green-700 font-medium mb-1">
                    <span>📍</span>
                    <span>Selected Location</span>
                  </div>
                  <div className="text-gray-600 space-y-1">
                    <div>
                      <strong>Coordinates:</strong> {fieldValue.lat.toFixed(3)},
                      {fieldValue.lng.toFixed(3)}
                    </div>
                    {fieldValue.address && (
                      <div>
                        <strong>Address:</strong> {fieldValue.address}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError[0]}</p>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading form...
          </h3>
          <p className="text-gray-600">
            Please wait while we prepare the form for you.
          </p>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Form not found
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
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
          <p className="text-gray-600 mb-6">
            Your response has been submitted successfully.
          </p>
          <button
            onClick={() => navigate("/")}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Invalid form
          </h3>
          <p className="text-gray-600">
            This form appears to be empty or invalid.
          </p>
        </div>
      </div>
    );
  }

  const currentPageData = form.pages[currentPage];
  const isLastPage = currentPage === form.pages.length - 1;
  const isFirstPage = currentPage === 0;
  const visibleFields = getVisibleFieldsForPage(currentPageData, formData);

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
                <span>
                  Page {currentPage + 1} of {form.pages.length}
                </span>
                <span>
                  {Math.round(((currentPage + 1) / form.pages.length) * 100)}%
                  complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentPage + 1) / form.pages.length) * 100}%`,
                  }}
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
            <p className="text-gray-600 mb-6">{currentPageData.description}</p>
          )}

          {/* Form Fields */}
          <div>{visibleFields.map((field) => renderField(field))}</div>

          {/* Required Email Field for Confirmation (always shown on last page) */}
          {isLastPage && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📧 Email <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-600 mb-3">
                This is only for sending you a confirmation that you
                successfully filled the form.
              </p>
              <input
                type="email"
                value={respondentEmail}
                onChange={(e) => setRespondentEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

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
