const Form = require("../models/Form");
const { validationResult } = require("express-validator");

// CREATE - Create a new form (simplified)
const createForm = async (req, res) => {
  try {
    // Check for validation errors from middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    // Extract title from request (simplified - only title needed)
    const { title = "Untitled Form" } = req.body;

    // Create form with sensible defaults
    const formData = {
      title: title.trim(),
      createdBy: req.user.id,
      status: "draft",
      fields: [], // Start empty - user will add fields
      pages: [
        {
          id: "page-1",
          name: "Page 1",
          fields: [], // Start with empty page
        },
      ],
      responses: [],
      views: 0
    };

    // Create and save new form
    const form = new Form(formData);
    await form.save();

    // Send success response
    res.status(201).json({
      success: true,
      message: "Form created successfully",
      data: form,
    });
  } catch (error) {
    console.error("Error creating form:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// READ - Get all forms for the authenticated user
const getAllForms = async (req, res) => {
  try {
    // Check for validation errors from middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    // Extract query parameters with default values
    const {
      page = 1, // Default to first page
      limit = 10, // Default 10 forms per page
      status = "all", // Default to show all statuses
      search = "", // Default empty search
      sortBy = "updatedAt", // Default sort by last updated
      sortOrder = "desc", // Default newest first
    } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build the query object
    let query = {
      createdBy: req.user.id, // Only get forms created by this user
    };

    // Add status filter if not 'all'
    if (status !== "all") {
      query.status = status;
    }

    // Add search functionality (searches in title)
    if (search.trim()) {
      query.title = {
        $regex: search.trim(), // MongoDB regex for partial matching
        $options: "i", // Case-insensitive search
      };
    }

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute the query with pagination
    const [forms, totalCount] = await Promise.all([
      Form.find(query)
        .sort(sortObject)
        .skip(skip)
        .limit(limitNumber)
        .select("-__v") // Exclude version key from response
        .populate("createdBy", "name email") // Include creator info
        .lean(), // Returns plain JavaScript objects (better performance)

      Form.countDocuments(query), // Get total count for pagination
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;

    // Transform forms data (add computed fields)
    const transformedForms = forms.map((form) => ({
      ...form,
      responseCount: form.responses ? form.responses.length : 0,
      lastResponseAt:
        form.responses && form.responses.length > 0
          ? new Date(
              Math.max(...form.responses.map((r) => new Date(r.submittedAt)))
            )
          : null,
      fieldCount: form.fields ? form.fields.length : 0,
    }));

    // Send success response with pagination metadata
    res.status(200).json({
      success: true,
      message: "Forms retrieved successfully",
      data: {
        forms: transformedForms,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalCount,
          limit: limitNumber,
          hasNextPage,
          hasPreviousPage,
        },
        filters: {
          status: status,
          search: search,
          sortBy,
          sortOrder,
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving forms:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// READ - Get a single form by ID
const getFormById = async (req, res) => {
  try {
    // Check for validation errors from middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    // Extract form ID from URL parameters
    const { id } = req.params;

    // Find the form by ID with additional data
    const form = await Form.findById(id)
      .select("-__v") // Exclude MongoDB version key
      .populate("createdBy", "name email avatar") // Include creator details
      .lean(); // Return plain JavaScript object for better performance

    // Check if form exists
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Security check: Ensure user can only access their own forms
    // Convert ObjectId to string for comparison
    if (form.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own forms.",
      });
    }

    // Enrich form data with computed fields
    const enrichedForm = {
      ...form,

      // Response analytics
      responseCount: form.responses ? form.responses.length : 0,
      lastResponseAt:
        form.responses && form.responses.length > 0
          ? new Date(
              Math.max(...form.responses.map((r) => new Date(r.submittedAt)))
            )
          : null,

      // Field analytics
      fieldCount: form.fields ? form.fields.length : 0,
      requiredFieldCount: form.fields
        ? form.fields.filter((field) => field.required).length
        : 0,

      // Form status information
      isPublished: form.status === "published",
      isDraft: form.status === "draft",
      isClosed: form.status === "closed",

      // Time calculations
      daysSinceCreated: Math.floor(
        (new Date() - new Date(form.createdAt)) / (1000 * 60 * 60 * 24)
      ),
      daysSinceUpdated: Math.floor(
        (new Date() - new Date(form.updatedAt)) / (1000 * 60 * 60 * 24)
      ),

      // Response rate calculation (if form is published)
      responseRate:
        form.status === "published" && form.views > 0
          ? (((form.responses?.length || 0) / form.views) * 100).toFixed(2)
          : null,

      // Field type breakdown
      fieldTypeBreakdown: form.fields
        ? form.fields.reduce((acc, field) => {
            acc[field.type] = (acc[field.type] || 0) + 1;
            return acc;
          }, {})
        : {},

      // Recent responses (last 5)
      recentResponses: form.responses
        ? form.responses
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
            .slice(0, 5)
            .map((response) => ({
              id: response.id,
              submittedAt: response.submittedAt,
              responsePreview:
                Object.keys(response.data).length > 0
                  ? `${Object.keys(response.data).length} fields completed`
                  : "Empty response",
            }))
        : [],
    };

    // Track form view (optional analytics)
    // Note: In production, you might want to track this separately
    // to avoid updating the form document on every view
    await Form.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } }, // Increment view count
      { new: false } // Don't return updated document
    );

    // Send success response
    res.status(200).json({
      success: true,
      message: "Form retrieved successfully",
      data: enrichedForm,
    });
  } catch (error) {
    console.error("Error retrieving form:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid form ID format",
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updateForm = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Clean up data that shouldn't be updated
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;

    // Handle pages structure - update both pages and fields
    if (updateData.pages) {
      // If pages are provided, also update the flat fields array for backwards compatibility
      updateData.fields = updateData.pages.flatMap((page) => page.fields || []);
    } else if (updateData.fields) {
      // If only fields provided, convert to pages structure
      updateData.pages = [
        {
          id: "page-1",
          name: "Page 1",
          fields: updateData.fields,
        },
      ];
    }

    // Check if form exists and user owns it
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validate fields if they're being updated
    if (updateData.fields) {
      for (let field of updateData.fields) {
        if (!field.id || !field.type || !field.label) {
          return res.status(400).json({
            success: false,
            message: "Fields must have id, type, and label",
          });
        }

        // Check if select/radio/checkbox has options
        if (["select", "radio", "checkbox"].includes(field.type)) {
          if (!field.options || field.options.length === 0) {
            return res.status(400).json({
              success: false,
              message: `${field.type} fields need options`,
            });
          }
        }
      }
    }

    // Can't publish empty form
    if (updateData.status === "published") {
      const fields = updateData.fields || form.fields;
      if (!fields || fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Can't publish form without fields",
        });
      }
    }

    // Update the form
    const updatedForm = await Form.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Form updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating form:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid form ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Check ownership
    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await Form.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Form deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting form:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid form ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const submitFormResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const requestBody = req.body;

    // Extract data from request body (handle both direct data and nested data structure)
    const responseData = requestBody.data || requestBody;

    // Find form
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Allow submissions to both published and draft forms (for testing)
    // In production, you might want to keep the published-only restriction
    if (form.status !== "published" && form.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Form is not available for submissions",
      });
    }

    // Basic validation - check required fields
    const fieldsToValidate = form.fields || [];
    for (let field of fieldsToValidate) {
      if (field.required) {
        const fieldValue = responseData[field.id];
        if (
          !fieldValue ||
          (typeof fieldValue === "string" && fieldValue.trim() === "") ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        ) {
          return res.status(400).json({
            success: false,
            message: `${field.label} is required`,
          });
        }
      }
    }

    // Create response object
    const newResponse = {
      id: Date.now().toString(), // Simple ID for now
      submittedAt: requestBody.submittedAt
        ? new Date(requestBody.submittedAt)
        : new Date(),
      data: responseData,
      submitterIP: req.ip || req.connection.remoteAddress || "unknown",
    };

    // Add response to form
    form.responses.push(newResponse);
    await form.save();

    res.status(201).json({
      success: true,
      message: "Response submitted successfully",
      data: {
        responseId: newResponse.id,
        submittedAt: newResponse.submittedAt,
      },
    });
  } catch (error) {
    console.error("Error submitting response:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid form ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get public form (for sharing - no auth needed)
const getPublicForm = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await Form.findById(id)
      .select("title fields status views pages createdAt updatedAt")
      .lean();

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Allow both published and draft forms for testing
    // In production, you might want to keep the published-only restriction
    if (form.status !== "published" && form.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Form is not available for public access",
      });
    }

    // Ensure pages exist, create from fields if needed (backwards compatibility)
    let formData = { ...form };
    if (!formData.pages || formData.pages.length === 0) {
      if (formData.fields && formData.fields.length > 0) {
        formData.pages = [
          {
            id: "page-1",
            name: "Page 1",
            fields: formData.fields,
          },
        ];
      } else {
        formData.pages = [];
      }
    }

    // Add name field for frontend compatibility
    formData.name = formData.title;

    // Increment view count
    await Form.findByIdAndUpdate(id, { $inc: { views: 1 } });

    res.status(200).json({
      success: true,
      message: "Form retrieved successfully",
      data: formData,
    });
  } catch (error) {
    console.error("Error getting public form:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid form ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get responses for a specific form
const getFormResponses = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 50,
      sortBy = "submittedAt",
      sortOrder = "desc",
    } = req.query;

    const form = await Form.findById(id)
      .select("title responses createdBy")
      .lean();

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Check ownership
    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Pagination
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Sort responses
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sortedResponses = form.responses.sort((a, b) => {
      if (sortBy === "submittedAt") {
        return (
          sortDirection * (new Date(a.submittedAt) - new Date(b.submittedAt))
        );
      }
      return 0;
    });

    // Apply pagination
    const paginatedResponses = sortedResponses.slice(skip, skip + limitNumber);
    const totalCount = form.responses.length;
    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      success: true,
      message: "Responses retrieved successfully",
      data: {
        formTitle: form.title,
        responses: paginatedResponses,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalCount,
          limit: limitNumber,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving responses:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get a single response by ID
const getResponseById = async (req, res) => {
  try {
    const { formId, responseId } = req.params;

    const form = await Form.findById(formId)
      .select("title responses createdBy fields pages")
      .lean();

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Check ownership
    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const response = form.responses.find((r) => r.id === responseId);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Response not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Response retrieved successfully",
      data: {
        formTitle: form.title,
        formFields: form.fields || [],
        formPages: form.pages || [],
        response,
      },
    });
  } catch (error) {
    console.error("Error retrieving response:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete a specific response
const deleteResponse = async (req, res) => {
  try {
    const { formId, responseId } = req.params;

    // Find the form
    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Check ownership - only form owner can delete responses
    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only delete responses from your own forms.",
      });
    }

    // Find the response to delete
    const responseIndex = form.responses.findIndex((r) => r.id === responseId);

    if (responseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Response not found",
      });
    }

    // Store response data for logging (optional)
    const deletedResponse = form.responses[responseIndex];

    // Remove the response from the array
    form.responses.splice(responseIndex, 1);

    // Save the form
    await form.save();

    // Log the deletion for audit purposes
    console.log(
      `Response ${responseId} deleted from form ${formId} by user ${req.user.id}`
    );

    res.status(200).json({
      success: true,
      message: "Response deleted successfully",
      data: {
        deletedResponseId: responseId,
        remainingResponses: form.responses.length,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error deleting response:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid form or response ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting response",
      error: error.message,
    });
  }
};

// SIMPLIFIED FIELD OPERATIONS

// Add field to specific page (backend generates ID)
const addFieldToPage = async (req, res) => {
  try {
    const { formId, pageId } = req.params;
    const fieldData = req.body;

    // Find the form
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    // Check ownership
    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Find the page
    const pageIndex = form.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Page not found"
      });
    }

    // Generate new field with backend ID
    const newField = {
      id: new Date().getTime().toString() + Math.random().toString(36).substr(2, 9),
      type: fieldData.type,
      label: fieldData.label || 'New Field',
      placeholder: fieldData.placeholder || '',
      required: fieldData.required || false,
      options: fieldData.options || [],
      validation: fieldData.validation || {},
      subfields: fieldData.subfields || []
    };

    // Add field to page
    form.pages[pageIndex].fields.push(newField);
    
    // Update flat fields array for backward compatibility
    form.fields = form.pages.flatMap(page => page.fields);
    
    await form.save();

    res.status(201).json({
      success: true,
      message: "Field added successfully",
      data: {
        field: newField,
        form: form
      }
    });
  } catch (error) {
    console.error("Error adding field:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Update specific field
const updateField = async (req, res) => {
  try {
    const { formId, fieldId } = req.params;
    const updates = req.body;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Find and update field in pages
    let fieldFound = false;
    for (let page of form.pages) {
      const fieldIndex = page.fields.findIndex(f => f.id === fieldId);
      if (fieldIndex !== -1) {
        page.fields[fieldIndex] = { ...page.fields[fieldIndex], ...updates };
        fieldFound = true;
        break;
      }
    }

    if (!fieldFound) {
      return res.status(404).json({
        success: false,
        message: "Field not found"
      });
    }

    // Update flat fields array
    form.fields = form.pages.flatMap(page => page.fields);
    
    await form.save();

    res.json({
      success: true,
      message: "Field updated successfully",
      data: form
    });
  } catch (error) {
    console.error("Error updating field:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Delete specific field
const deleteField = async (req, res) => {
  try {
    const { formId, fieldId } = req.params;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Remove field from pages
    let fieldFound = false;
    for (let page of form.pages) {
      const fieldIndex = page.fields.findIndex(f => f.id === fieldId);
      if (fieldIndex !== -1) {
        page.fields.splice(fieldIndex, 1);
        fieldFound = true;
        break;
      }
    }

    if (!fieldFound) {
      return res.status(404).json({
        success: false,
        message: "Field not found"
      });
    }

    // Update flat fields array
    form.fields = form.pages.flatMap(page => page.fields);
    
    // Remove conditional rules related to this field
    form.conditionalRules = form.conditionalRules.filter(rule => 
      rule.triggerFieldId !== fieldId && rule.targetFieldId !== fieldId
    );
    
    await form.save();

    res.json({
      success: true,
      message: "Field deleted successfully",
      data: form
    });
  } catch (error) {
    console.error("Error deleting field:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Add page to form
const addPageToForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const { name } = req.body;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Check page limit
    if (form.pages.length >= 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 pages allowed per form"
      });
    }

    // Generate new page with backend ID
    const newPage = {
      id: new Date().getTime().toString() + Math.random().toString(36).substr(2, 9),
      name: name || `Page ${form.pages.length + 1}`,
      fields: []
    };

    form.pages.push(newPage);
    await form.save();

    res.status(201).json({
      success: true,
      message: "Page added successfully",
      data: {
        page: newPage,
        form: form
      }
    });
  } catch (error) {
    console.error("Error adding page:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Delete page from form
const deletePageFromForm = async (req, res) => {
  try {
    const { formId, pageId } = req.params;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Can't delete the last page
    if (form.pages.length <= 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the last remaining page"
      });
    }

    const pageIndex = form.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Page not found"
      });
    }

    // Get field IDs from the page being deleted
    const fieldsToDelete = form.pages[pageIndex].fields.map(f => f.id);
    
    // Remove the page
    form.pages.splice(pageIndex, 1);
    
    // Update flat fields array
    form.fields = form.pages.flatMap(page => page.fields);
    
    // Remove conditional rules related to fields from deleted page
    form.conditionalRules = form.conditionalRules.filter(rule => 
      !fieldsToDelete.includes(rule.triggerFieldId) && 
      !fieldsToDelete.includes(rule.targetFieldId) &&
      rule.targetPageId !== pageId
    );
    
    await form.save();

    res.json({
      success: true,
      message: "Page deleted successfully",
      data: form
    });
  } catch (error) {
    console.error("Error deleting page:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get form analytics
const getFormAnalytics = async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId).select("title responses views fields createdBy createdAt updatedAt");
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Calculate analytics
    const analytics = {
      totalResponses: form.responses?.length || 0,
      totalViews: form.views || 0,
      totalFields: form.fields?.length || 0,
      responseRate: form.views > 0 ? (((form.responses?.length || 0) / form.views) * 100).toFixed(2) : 0,
      lastResponseAt: form.responses && form.responses.length > 0
        ? new Date(Math.max(...form.responses.map(r => new Date(r.submittedAt))))
        : null,
      daysSinceCreated: Math.floor((new Date() - new Date(form.createdAt)) / (1000 * 60 * 60 * 24)),
      daysSinceUpdated: Math.floor((new Date() - new Date(form.updatedAt)) / (1000 * 60 * 60 * 24))
    };

    res.json({
      success: true,
      message: "Analytics retrieved successfully",
      data: analytics
    });
  } catch (error) {
    console.error("Error getting analytics:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// CONDITIONAL LOGIC OPERATIONS

// Add conditional rule
const addConditionalRule = async (req, res) => {
  try {
    const { formId } = req.params;
    const ruleData = req.body;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Generate new rule with backend ID
    const newRule = {
      id: new Date().getTime().toString() + Math.random().toString(36).substr(2, 9),
      triggerFieldId: ruleData.triggerFieldId,
      targetFieldId: ruleData.targetFieldId,
      targetPageId: ruleData.targetPageId,
      condition: ruleData.condition,
      value: ruleData.value || '',
      action: ruleData.action
    };

    form.conditionalRules.push(newRule);
    await form.save();

    res.status(201).json({
      success: true,
      message: "Conditional rule added successfully",
      data: newRule
    });
  } catch (error) {
    console.error("Error adding conditional rule:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get conditional rules
const getConditionalRules = async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId).select("conditionalRules createdBy");
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    res.json({
      success: true,
      message: "Conditional rules retrieved successfully",
      data: form.conditionalRules || []
    });
  } catch (error) {
    console.error("Error getting conditional rules:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Delete conditional rule
const deleteConditionalRule = async (req, res) => {
  try {
    const { formId, ruleId } = req.params;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const ruleIndex = form.conditionalRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Conditional rule not found"
      });
    }

    form.conditionalRules.splice(ruleIndex, 1);
    await form.save();

    res.json({
      success: true,
      message: "Conditional rule deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting conditional rule:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

module.exports = {
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
};
