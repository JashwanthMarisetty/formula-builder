const Form = require("../models/Form");
const { validationResult } = require("express-validator");

// CREATE - Create a new form
const createForm = async (req, res) => {
  try {
    // Check for validation errors from middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: "Validation errors",
        errors: errors.array() 
      });
    }

    // Extract data from request body
    const { title, fields = [] } = req.body;

    // Create new form instance
    const form = new Form({
      title,
      fields,
      createdBy: req.user.id, // This comes from auth middleware
      status: 'draft', // Default status for new forms
      responses: [] // Initialize with empty responses
    });

    // Save to database
    await form.save();

    // Send success response
    res.status(201).json({
      success: true,
      message: "Form created successfully",
      data: form
    });

  } catch (error) {
    console.error("Error creating form:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error.message 
    });
  }
};

module.exports = {
  createForm
};
