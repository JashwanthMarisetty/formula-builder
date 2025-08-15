// Utility functions for conditional logic evaluation

// Field types that are suitable for conditional logic
export const CONDITIONAL_LOGIC_FIELD_TYPES = [
  'text',
  'email',
  'phone',
  'number',
  'textarea',
  'select',
  'radio', 
  'checkbox',
  'date',
  'time',
  'rating',
  'file',
  'website',
  'address'
];

// Check if a field type supports conditional logic
export const supportsConditionalLogic = (fieldType) => {
  return CONDITIONAL_LOGIC_FIELD_TYPES.includes(fieldType);
};

/**
 * Evaluates a single condition against form data
 * @param {Object} condition - The condition to evaluate
 * @param {Object} formData - Current form data
 * @param {Array} allFields - All available fields
 * @returns {boolean} - Whether the condition is met
 */
export const evaluateCondition = (condition, formData, allFields) => {
  const { triggerFieldId, state, value } = condition;
  const fieldValue = formData[triggerFieldId];
  const triggerField = allFields.find(f => f.id === triggerFieldId);

  if (!triggerField) return false;

  // Handle different condition states
  switch (state) {
    case 'is equal to':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(value);
      }
      return String(fieldValue || '').toLowerCase() === String(value || '').toLowerCase();

    case 'is not equal to':
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(value);
      }
      return String(fieldValue || '').toLowerCase() !== String(value || '').toLowerCase();

    case 'contains':
      if (Array.isArray(fieldValue)) {
        return fieldValue.some(v => String(v).toLowerCase().includes(String(value || '').toLowerCase()));
      }
      return String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase());

    case 'does not contain':
      if (Array.isArray(fieldValue)) {
        return !fieldValue.some(v => String(v).toLowerCase().includes(String(value || '').toLowerCase()));
      }
      return !String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase());

    case 'is greater than':
      const numValue = parseFloat(value);
      const numFieldValue = parseFloat(fieldValue);
      return !isNaN(numFieldValue) && !isNaN(numValue) && numFieldValue > numValue;

    case 'is less than':
      const numValue2 = parseFloat(value);
      const numFieldValue2 = parseFloat(fieldValue);
      return !isNaN(numFieldValue2) && !isNaN(numValue2) && numFieldValue2 < numValue2;

    case 'is empty':
      if (Array.isArray(fieldValue)) {
        return fieldValue.length === 0;
      }
      return !fieldValue || String(fieldValue).trim() === '';

    case 'is not empty':
      if (Array.isArray(fieldValue)) {
        return fieldValue.length > 0;
      }
      return fieldValue && String(fieldValue).trim() !== '';

    case 'starts with':
      return String(fieldValue || '').toLowerCase().startsWith(String(value || '').toLowerCase());

    case 'ends with':
      return String(fieldValue || '').toLowerCase().endsWith(String(value || '').toLowerCase());

    case 'is greater than or equal to':
      const numValue3 = parseFloat(value);
      const numFieldValue3 = parseFloat(fieldValue);
      return !isNaN(numFieldValue3) && !isNaN(numValue3) && numFieldValue3 >= numValue3;

    case 'is less than or equal to':
      const numValue4 = parseFloat(value);
      const numFieldValue4 = parseFloat(fieldValue);
      return !isNaN(numFieldValue4) && !isNaN(numValue4) && numFieldValue4 <= numValue4;

    case 'is selected':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(value) || fieldValue.length > 0;
      }
      return Boolean(fieldValue);

    case 'is not selected':
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(value) || fieldValue.length === 0;
      }
      return !Boolean(fieldValue);

    case 'has any value':
      if (Array.isArray(fieldValue)) {
        return fieldValue.length > 0;
      }
      return fieldValue !== null && fieldValue !== undefined && String(fieldValue).trim() !== '';

    case 'has specific value':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(value);
      }
      return String(fieldValue || '').toLowerCase() === String(value || '').toLowerCase();

    default:
      return false;
  }
};

/**
 * Evaluates grouped conditions with AND/OR logic
 * @param {Array} conditions - Array of conditions to evaluate
 * @param {Object} formData - Current form data
 * @param {Array} allFields - All available fields
 * @returns {boolean} - Whether the grouped conditions are met
 */
export const evaluateGroupedConditions = (conditions, formData, allFields) => {
  if (!conditions || conditions.length === 0) return false;
  if (conditions.length === 1) {
    return evaluateCondition(conditions[0], formData, allFields);
  }

  let result = evaluateCondition(conditions[0], formData, allFields);
  
  for (let i = 1; i < conditions.length; i++) {
    const condition = conditions[i];
    const conditionResult = evaluateCondition(condition, formData, allFields);
    
    if (condition.operator === 'OR') {
      result = result || conditionResult;
    } else { // Default to AND
      result = result && conditionResult;
    }
    
    // Early termination optimizations
    if (condition.operator === 'OR' && result) break;
    if (condition.operator === 'AND' && !result) break;
  }
  
  return result;
};

/**
 * Validates a single condition
 * @param {Object} condition - The condition to validate
 * @param {Array} allFields - All available fields
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateCondition = (condition, allFields) => {
  const errors = [];
  
  if (!condition.triggerFieldId) {
    errors.push('Please select a trigger field');
  }
  
  if (!condition.state) {
    errors.push('Please select a condition');
  }
  
  const triggerField = allFields.find(f => f.id === condition.triggerFieldId);
  if (triggerField && !supportsConditionalLogic(triggerField.type)) {
    errors.push(`Field type "${triggerField.type}" does not support conditional logic`);
  }
  
  // Check if value is required for this condition state
  const valueRequiredStates = [
    'is equal to', 'is not equal to', 'contains', 'does not contain',
    'starts with', 'ends with', 'is greater than', 'is less than',
    'is greater than or equal to', 'is less than or equal to', 'has specific value'
  ];
  
  if (valueRequiredStates.includes(condition.state) && !condition.value && condition.value !== 0) {
    errors.push('Please enter a value for this condition');
  }
  
  // Validate value type for numeric conditions
  if (triggerField && triggerField.type === 'number') {
    const numericStates = [
      'is greater than', 'is less than', 'is greater than or equal to', 'is less than or equal to'
    ];
    if (numericStates.includes(condition.state) && condition.value && isNaN(parseFloat(condition.value))) {
      errors.push('Please enter a valid number');
    }
  }
  
  // Validate value exists in options for select/radio fields
  if (triggerField && ['select', 'radio'].includes(triggerField.type)) {
    if (condition.value && triggerField.options && !triggerField.options.includes(condition.value)) {
      errors.push('Selected value is not available in field options');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Gets visible fields based on field conditions
 * @param {Array} fields - All fields on the page
 * @param {Array} fieldConditions - Field conditions to evaluate
 * @param {Object} formData - Current form data
 * @param {Array} allFields - All available fields
 * @returns {Array} - Array of visible field IDs
 */
export const getVisibleFields = (fields, fieldConditions, formData, allFields) => {
  const visibleFields = new Set(fields.map(f => f.id));

  fieldConditions.forEach(condition => {
    const isConditionMet = evaluateCondition(condition, formData, allFields);
    const { targetFieldId, action } = condition;

    if (isConditionMet) {
      if (action === 'show') {
        visibleFields.add(targetFieldId);
      } else if (action === 'hide') {
        visibleFields.delete(targetFieldId);
      }
    } else {
      // Reverse logic when condition is not met
      if (action === 'show') {
        visibleFields.delete(targetFieldId);
      } else if (action === 'hide') {
        visibleFields.add(targetFieldId);
      }
    }
  });

  return Array.from(visibleFields);
};

/**
 * Determines the next page based on page conditions
 * @param {number} currentPageIndex - Current page index
 * @param {Array} pages - All pages
 * @param {Array} pageConditions - Page conditions to evaluate
 * @param {Object} formData - Current form data
 * @param {Array} allFields - All available fields
 * @returns {number} - Next page index
 */
export const getNextPageIndex = (currentPageIndex, pages, pageConditions, formData, allFields) => {
  const currentPage = pages[currentPageIndex];
  if (!currentPage) return currentPageIndex;

  // Check for skip conditions
  const skipConditions = pageConditions.filter(c => 
    c.action === 'skip to' && 
    allFields.some(f => f.pageId === currentPage.id && f.id === c.triggerFieldId)
  );

  for (const condition of skipConditions) {
    const isConditionMet = evaluateCondition(condition, formData, allFields);
    if (isConditionMet) {
      const targetPageIndex = pages.findIndex(p => p.id === condition.targetPageId);
      if (targetPageIndex !== -1) {
        return targetPageIndex;
      }
    }
  }

  // Default to next page
  return Math.min(currentPageIndex + 1, pages.length - 1);
};

/**
 * Gets visible pages based on page conditions
 * @param {Array} pages - All pages
 * @param {Array} pageConditions - Page conditions to evaluate
 * @param {Object} formData - Current form data
 * @param {Array} allFields - All available fields
 * @returns {Array} - Array of visible page IDs
 */
export const getVisiblePages = (pages, pageConditions, formData, allFields) => {
  const visiblePages = new Set(pages.map(p => p.id));

  pageConditions.forEach(condition => {
    if (condition.action === 'hide page') {
      const isConditionMet = evaluateCondition(condition, formData, allFields);
      const { targetPageId } = condition;

      if (isConditionMet) {
        visiblePages.delete(targetPageId);
      }
    }
  });

  return Array.from(visiblePages);
};