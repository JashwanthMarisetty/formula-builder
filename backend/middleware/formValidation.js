const { body, param, query } = require("express-validator");

/**
 * Validation middleware for creating a new form
 * Purpose: Ensures form creation data is valid before processing
 */
const createFormValidation = [
  body("title")
    .notEmpty()
    .withMessage("Form title is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Form title must be between 1 and 200 characters")
    .trim()
    .escape(), // Prevents XSS attacks
  
  body("fields")
    .optional()
    .isArray()
    .withMessage("Fields must be an array")
    .custom((fields) => {
      // Validate each field in the array
      if (fields && fields.length > 0) {
        for (let field of fields) {
          if (!field.id || !field.type || !field.label) {
            throw new Error("Each field must have id, type, and label");
          }
          
          // Validate field types
          const allowedTypes = ['text', 'email', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date', 'time', 'file'];
          if (!allowedTypes.includes(field.type)) {
            throw new Error(`Invalid field type: ${field.type}`);
          }
        }
      }
      return true;
    }),

  body("status")
    .optional()
    .isIn(['draft', 'published', 'closed'])
    .withMessage("Status must be either draft, published, or closed")
];

/**
 * Validation middleware for getting a single form by ID
 * Purpose: Validates MongoDB ObjectId format
 */
const getFormByIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid form ID format")
];

/**
 * Validation middleware for updating a form
 * Purpose: Validates update data and form ID
 */
const updateFormValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid form ID format"),
    
  body("title")
    .optional()
    .notEmpty()
    .withMessage("Form title cannot be empty")
    .isLength({ min: 1, max: 200 })
    .withMessage("Form title must be between 1 and 200 characters")
    .trim()
    .custom((value) => {
      if (value && value.trim().length === 0) {
        throw new Error('Form title cannot be empty or just whitespace');
      }
      return true;
    })
    .escape(),
    
  body("fields")
    .optional()
    .isArray()
    .withMessage("Fields must be an array"),
    
  body("status")
    .optional()
    .isIn(['draft', 'published', 'closed'])
    .withMessage("Status must be either draft, published, or closed")
];

/**
 * Validation middleware for deleting a form
 * Purpose: Validates form ID for deletion
 */
const deleteFormValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid form ID format")
];

/**
 * Validation middleware for form queries (filtering, pagination)
 * Purpose: Validates query parameters for form listing
 */
const getFormsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
    
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
    
  query("status")
    .optional()
    .isIn(['draft', 'published', 'closed', 'all'])
    .withMessage("Status must be draft, published, closed, or all"),
    
  query("search")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Search term cannot exceed 100 characters")
    .trim()
    .escape()
];

/**
 * Validation middleware for form responses submission
 * Purpose: Validates form response data
 */
const submitFormResponseValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid form ID format"),
    
  body("responses")
    .isObject()
    .withMessage("Responses must be an object")
    .notEmpty()
    .withMessage("Responses cannot be empty")
];

module.exports = {
  createFormValidation,
  getFormByIdValidation,
  updateFormValidation,
  deleteFormValidation,
  getFormsValidation,
  submitFormResponseValidation
};
