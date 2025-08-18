const express = require("express");
const router = express.Router();
const { 
  createForm, 
  getAllForms,
  getFormById,
  updateForm,
  deleteForm,
  submitFormResponse,
  getPublicForm
} = require("../Controllers/formController");
const { auth } = require("../middleware/auth");
const {
  createFormValidation,
  getFormsValidation,
  getFormByIdValidation
} = require("../middleware/formValidation");

// GET /api/forms - Get all forms for authenticated user
router.get("/", auth, getFormsValidation, getAllForms);

// GET /api/forms/:id - Get a single form by ID
router.get("/:id", auth, getFormByIdValidation, getFormById);

// POST /api/forms - Create a new form
router.post("/", auth, createFormValidation, createForm);

// PUT /api/forms/:id - Update a form
router.put("/:id", auth, updateForm);

// DELETE /api/forms/:id - Delete a form
router.delete("/:id", auth, deleteForm);

module.exports = router;
