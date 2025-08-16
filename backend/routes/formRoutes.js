const express = require("express");
const router = express.Router();
const { 
  createForm, 
  getAllForms 
} = require("../Controllers/formController");
const { auth } = require("../middleware/auth");
const {
  createFormValidation,
  getFormsValidation
} = require("../middleware/formValidation");

// GET /api/forms - Get all forms for authenticated user
router.get("/", auth, getFormsValidation, getAllForms);

// POST /api/forms - Create a new form
router.post("/", auth, createFormValidation, createForm);

module.exports = router;
