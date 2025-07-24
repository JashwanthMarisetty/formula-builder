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
  'is greater than',
  'is less than',
  'is empty',
  'is not empty'
];