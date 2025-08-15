// Application constants
export const MAX_PAGES = 10;
export const MAX_FIELDS_PER_PAGE = 50;
export const SUPPORTED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.jpg', '.png', '.gif'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const AUTO_SAVE_DELAY = 30000; // 30 seconds in milliseconds

// Conditional logic condition states
export const CONDITION_STATES = [
  'is equal to',
  'is not equal to',
  'contains',
  'does not contain',
  'starts with',
  'ends with',
  'is greater than',
  'is less than',
  'is greater than or equal to',
  'is less than or equal to',
  'is empty',
  'is not empty',
  'is selected',
  'is not selected',
  'has any value',
  'has specific value'
];

// Field-type specific condition states
export const FIELD_TYPE_CONDITIONS = {
  text: ['is equal to', 'is not equal to', 'contains', 'does not contain', 'starts with', 'ends with', 'is empty', 'is not empty', 'has any value'],
  email: ['is equal to', 'is not equal to', 'contains', 'does not contain', 'starts with', 'ends with', 'is empty', 'is not empty', 'has any value'],
  phone: ['is equal to', 'is not equal to', 'contains', 'does not contain', 'starts with', 'ends with', 'is empty', 'is not empty', 'has any value'],
  number: ['is equal to', 'is not equal to', 'is greater than', 'is less than', 'is greater than or equal to', 'is less than or equal to', 'is empty', 'is not empty', 'has any value'],
  textarea: ['is equal to', 'is not equal to', 'contains', 'does not contain', 'starts with', 'ends with', 'is empty', 'is not empty', 'has any value'],
  select: ['is equal to', 'is not equal to', 'is empty', 'is not empty', 'has any value', 'has specific value'],
  radio: ['is equal to', 'is not equal to', 'is empty', 'is not empty', 'has any value', 'has specific value'],
  checkbox: ['is selected', 'is not selected', 'contains', 'does not contain', 'is empty', 'is not empty'],
  date: ['is equal to', 'is not equal to', 'is greater than', 'is less than', 'is greater than or equal to', 'is less than or equal to', 'is empty', 'is not empty'],
  time: ['is equal to', 'is not equal to', 'is greater than', 'is less than', 'is greater than or equal to', 'is less than or equal to', 'is empty', 'is not empty'],
  rating: ['is equal to', 'is not equal to', 'is greater than', 'is less than', 'is greater than or equal to', 'is less than or equal to', 'is empty', 'is not empty'],
  file: ['is empty', 'is not empty', 'has any value'],
  website: ['is equal to', 'is not equal to', 'contains', 'does not contain', 'starts with', 'ends with', 'is empty', 'is not empty', 'has any value'],
  address: ['is empty', 'is not empty', 'has any value', 'contains', 'does not contain']
};

// Get condition states for a specific field type
export const getConditionStatesForFieldType = (fieldType) => {
  return FIELD_TYPE_CONDITIONS[fieldType] || CONDITION_STATES;
};
