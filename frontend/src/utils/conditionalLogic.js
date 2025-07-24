// Utility functions for conditional logic evaluation

// Field types that are suitable for conditional logic
export const CONDITIONAL_LOGIC_FIELD_TYPES = [
  'select',
  'radio', 
  'checkbox',
  'date',
  'time',
  'rating'
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

    default:
      return false;
  }
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