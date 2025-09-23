const express = require("express");
const router = express.Router();
const { 
  createForm, 
  getAllForms,
  getFormById,
  updateForm,
  deleteForm,
  submitFormResponse,
  getPublicForm,
  getFormResponses,
  getResponseById,
  deleteResponse,
  // New simplified endpoints
  addFieldToPage,
  updateField,
  deleteField,
  addPageToForm,
  deletePageFromForm,
  getFormAnalytics,
  addConditionalRule,
  getConditionalRules,
  deleteConditionalRule
} = require("../Controllers/formController");
const { auth } = require("../middleware/auth");
const {
  createFormValidation,
  getFormsValidation,
  getFormByIdValidation,
  updateFormValidation
} = require("../middleware/formValidation");

// GET /api/forms - Get all forms for authenticated user
router.get("/", auth, getFormsValidation, getAllForms);

// GET /api/forms/:id - Get a single form by ID
router.get("/:id", auth, getFormByIdValidation, getFormById);

// POST /api/forms - Create a new form
router.post("/", auth, createFormValidation, createForm);

// PUT /api/forms/:id - Update a form
router.put("/:id", auth, updateFormValidation, updateForm);

// DELETE /api/forms/:id - Delete a form
router.delete("/:id", auth, deleteForm);

// PUBLIC ROUTES (no auth required)
// GET /api/forms/public/:id - Get public form for sharing
router.get("/public/:id", getPublicForm);

// POST /api/forms/:id/submit - Submit response to form
router.post("/:id/submit", submitFormResponse);

// RESPONSE MANAGEMENT ROUTES (auth required)
// GET /api/forms/:id/responses - Get all responses for a form
router.get("/:id/responses", auth, getFormResponses);

// GET /api/forms/:formId/responses/:responseId - Get a single response
router.get("/:formId/responses/:responseId", auth, getResponseById);

// DELETE /api/forms/:formId/responses/:responseId - Delete a specific response
router.delete("/:formId/responses/:responseId", auth, deleteResponse);

// FIELD OPERATIONS (new simplified endpoints)
// POST /api/forms/:formId/pages/:pageId/fields - Add field to specific page
router.post("/:formId/pages/:pageId/fields", auth, addFieldToPage);

// PATCH /api/forms/:formId/fields/:fieldId - Update specific field
router.patch("/:formId/fields/:fieldId", auth, updateField);

// DELETE /api/forms/:formId/fields/:fieldId - Delete specific field
router.delete("/:formId/fields/:fieldId", auth, deleteField);

// PAGE OPERATIONS
// POST /api/forms/:formId/pages - Add new page to form
router.post("/:formId/pages", auth, addPageToForm);

// DELETE /api/forms/:formId/pages/:pageId - Delete specific page
router.delete("/:formId/pages/:pageId", auth, deletePageFromForm);

// ANALYTICS
// GET /api/forms/:formId/analytics - Get form analytics
router.get("/:formId/analytics", auth, getFormAnalytics);

// CONDITIONAL LOGIC
// POST /api/forms/:formId/conditional-rules - Add conditional rule
router.post("/:formId/conditional-rules", auth, addConditionalRule);

// GET /api/forms/:formId/conditional-rules - Get conditional rules
router.get("/:formId/conditional-rules", auth, getConditionalRules);

// DELETE /api/forms/:formId/conditional-rules/:ruleId - Delete conditional rule
router.delete("/:formId/conditional-rules/:ruleId", auth, deleteConditionalRule);

module.exports = router;
