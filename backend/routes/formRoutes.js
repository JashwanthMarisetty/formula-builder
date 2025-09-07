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
  deleteResponse
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

module.exports = router;
