const express = require("express");
const router = express.Router();
const { createForm } = require("../Controllers/formController");
const { auth } = require("../middleware/auth");
const { body } = require("express-validator");

// Validation middleware for creating forms
const createFormValidation = [
  body("title")
    .notEmpty()
    .withMessage("Form title is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Form title must be between 1 and 200 characters")
    .trim(),
  
  body("fields")
    .optional()
    .isArray()
    .withMessage("Fields must be an array")
];

// POST /api/forms - Create a new form
router.post("/", auth, createFormValidation, createForm);

module.exports = router;
