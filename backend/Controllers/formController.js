const Form = require("../models/Form");
const Response = require("../models/Response");
const { validationResult } = require("express-validator");
const { sendEmail } = require("../utils/sendEmail");
const { isFieldVisible, buildReachablePageIds } = require("../utils/logic");
const { reverseGeocode } = require("../utils/geocode");

// CREATE - Create a new form
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

    // Extract data from request body
    const { title, fields = [], pages = [] } = req.body;

    // Additional title validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Form title is required and cannot be empty",
      });
    }

    // Initialize form data with default page if no pages provided
    let formData = {
      title: title.trim(),
      createdBy: req.user.id,
      location: "inbox",
    };

    if (pages && pages.length > 0) {
      // Multi-page form: use pages structure
      formData.pages = pages;

      const allFields = [];

      for (const page of pages) {
        if (Array.isArray(page.fields)) {
          for (const field of page.fields) {
            allFields.push(field);
          }
        }
      }

      formData.fields = allFields;
    } else {
      // Legacy or single-page form: convert fields to pages structure
      formData.fields = fields;
      formData.pages = [
        {
          id: "page-1",
          name: "Page 1",
          fields: fields,
        },
      ];
    }

    // Create new form instance
    const form = new Form(formData);

    // Save to database
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
      search = "", // Default empty search
      sortBy = "updatedAt", // Default sort by last updated
      sortOrder = "desc", // Default newest first
      location = "inbox", // Default to inbox (can be inbox, archive, trash)
    } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build the query object
    let query = {
      createdBy: req.user.id, // Only get forms created by this user
    };

    // Add location filter (inbox, archive, trash)
    if (location) {
      query.location = location;
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
    if (sortOrder === "asc") {
      sortObject[sortBy] = 1; // ascending order
    } else {
      sortObject[sortBy] = -1; // descending order
    }

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

    // const totalCount = await Form.countDocuments(query);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNumber);

    let hasNextPage = false;

    if (pageNumber < totalPages) {
      hasNextPage = true;
    }

    let hasPreviousPage = false;

    if (pageNumber > 1) {
      hasPreviousPage = true;
    }

    // Forms are already in the correct format from the database
    // No transformation needed - frontend calculates stats on demand

    // Send success response with pagination metadata
    res.status(200).json({
      success: true,
      message: "Forms retrieved successfully",
      data: {
        forms: forms,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalCount,
          limit: limitNumber,
          hasNextPage,
          hasPreviousPage,
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

    // Return form data - frontend calculates stats as needed

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
      data: form,
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

    const allFields = [];

    for (const page of updateData.pages) {
      const pageFields = page.fields || [];
      allFields.push(...pageFields);
    }

    updateData.fields = allFields;

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

    // Delete all responses for this form (new collection)
    await Response.deleteMany({ formId: id });

    // Delete the form
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
    const { data, submittedAt, respondentEmail = "" } = req.body || {};
    const responseData = data || req.body || {};

    // 1) Find form
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    // 2) Basic email check (only if provided)
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (respondentEmail && !isValidEmail(respondentEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // 2.1) Limit: max 5 responses per email for this form
    if (respondentEmail) {
      const existingCount = await Response.countDocuments({
        formId: id,
        respondentEmail,
      });

      if (existingCount >= 5) {
        return res.status(400).json({
          success: false,
          message: "You reached the response limit",
        });
      }
    }

    // 3) Resolve pages + visibility
    const pages = Array.isArray(form.pages) && form.pages.length
      ? form.pages
      : [{ id: "page-1", name: "Page 1", fields: form.fields || [], logic: {} }];

    const reachable = buildReachablePageIds(pages, responseData);
    const visibleIds = new Set();
    for (const page of pages) {
      if (!reachable.has(page.id)) continue;
      for (const field of page.fields || []) {
        if (isFieldVisible(field, responseData)) visibleIds.add(field.id);
      }
    }

    // 4) Enforce required only for visible fields
    for (const field of form.fields || []) {
      if (!field.required || !visibleIds.has(field.id)) continue;
      const v = responseData[field.id];
      const isEmptyString = typeof v === "string" && v.trim() === "";
      const isEmptyArray = Array.isArray(v) && v.length === 0;
      if (v == null || isEmptyString || isEmptyArray) {
        return res.status(400).json({ success: false, message: `${field.label} is required` });
      }
    }

    // 5) Normalize and enrich location answers
    try {
      function roundTo3(n) { return Number(n.toFixed(3)); }
      for (const page of pages) {
        for (const field of page.fields || []) {
          if (field.type !== "location") continue;
          const loc = responseData[field.id];
          if (!loc || typeof loc !== "object") continue;
          const latRaw = Number(loc.lat);
          const lngRaw = Number(loc.lng);
          if (!Number.isFinite(latRaw) || !Number.isFinite(lngRaw)) continue;
          const lat = roundTo3(latRaw);
          const lng = roundTo3(lngRaw);
          responseData[field.id] = { ...loc, lat, lng };
          const geo = await reverseGeocode(lat, lng);
          if (geo) {
            responseData[field.id] = {
              ...responseData[field.id],
              address: loc.address || geo.address,
              city: loc.city || geo.city || null,
              state: loc.state || geo.state || null,
              country: loc.country || geo.country || null,
            };
          }
        }
      }
    } catch (e) {
      console.warn("Location enrichment failed:", e?.message || e);
    }

    // 6) Save response in separate collection
    const newResponse = new Response({
      formId: id,
      submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
      data: responseData,
      submitterIP: req.ip || req.connection?.remoteAddress || "unknown",
      respondentEmail,
    });
    await newResponse.save();

    // 7) Update form counters (denormalized)
    await Form.findByIdAndUpdate(id, {
      $inc: { responsesCount: 1 },
      lastResponseAt: newResponse.submittedAt,
    });

    // 8) Fire-and-forget confirmation email
    if (respondentEmail) {
      const subject = `Form Submission Confirmation - ${form.title}`;
      const text = "Thank you for your submission! We have received your response.";
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style=\"color: #7c3aed; margin-bottom: 20px;\">${form.title}</h2>
            <p style=\"color: #374151; font-size: 16px; line-height: 1.6;\">
              Thank you for your submission! We have received your response.
            </p>
            <div style=\"background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;\">
              <p style=\"color: #6b7280; font-size: 14px; margin: 0;\">
                <strong>Submission ID:</strong> ${newResponse._id}<br>
                <strong>Submitted at:</strong> ${new Date(newResponse.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>`;
      sendEmail(respondentEmail, subject, text, html).catch((err) =>
        console.error("Error sending confirmation email to respondent:", err.message)
      );
    }

    return res.status(201).json({ success: true, message: "Response submitted successfully" });
  } catch (error) {
    console.error("Error submitting response:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid form ID format" });
    }
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get public form (for sharing - no auth needed)
const getPublicForm = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await Form.findById(id)
      .select(
        "title fields views pages createdAt updatedAt collectRespondentEmail"
      )
      .lean();

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
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

// Get responses for a specific form (from Response collection)
const getFormResponses = async (req, res) => {
  try {
    const { id } = req.params;

    let { page, limit, sortBy, sortOrder } = req.query;

    if (!page) page = 1;
    if (!limit) limit = 10;
    if (!sortBy) sortBy = "submittedAt";
    if (!sortOrder) sortOrder = "desc";

    const form = await Form.findById(id)
      .select("title createdBy")
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

    // Sort
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sortObject = { [sortBy]: sortDirection };

    // Query separate collection
    const [docs, totalCount] = await Promise.all([
      Response.find({ formId: id })
        .sort(sortObject)
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Response.countDocuments({ formId: id }),
    ]);

    const responses = docs.map((r) => ({
      id: String(r._id),
      submittedAt: r.submittedAt,
      data: r.data,
      submitterIP: r.submitterIP,
      respondentEmail: r.respondentEmail,
    }));

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      success: true,
      message: "Responses retrieved successfully",
      data: {
        formTitle: form.title,
        responses,
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

// Get a single response by ID (from Response collection)
const getResponseById = async (req, res) => {
  try {
    const { formId, responseId } = req.params;

    const form = await Form.findById(formId)
      .select("title createdBy fields pages")
      .lean();

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    // Check ownership
    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const r = await Response.findOne({ _id: responseId, formId: formId }).lean();

    if (!r) {
      return res.status(404).json({ success: false, message: "Response not found" });
    }

    const response = {
      id: String(r._id),
      submittedAt: r.submittedAt,
      data: r.data,
      submitterIP: r.submitterIP,
      respondentEmail: r.respondentEmail,
    };

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
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete a specific response (from Response collection)
const deleteResponse = async (req, res) => {
  try {
    const { formId, responseId } = req.params;

    // Find the form
    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    // Check ownership - only form owner can delete responses
    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete responses from your own forms.",
      });
    }

    // Delete from Response collection
    const deleted = await Response.findOneAndDelete({ _id: responseId, formId: formId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Response not found" });
    }

    // Update counters
    await Form.findByIdAndUpdate(formId, { $inc: { responsesCount: -1 } });

    // Log the deletion for audit purposes
    console.log(`Response ${responseId} deleted from form ${formId} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: "Response deleted successfully",
      data: {
        deletedResponseId: responseId,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error deleting response:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid form or response ID format" });
    }

    res.status(500).json({ success: false, message: "Server error while deleting response", error: error.message });
  }
};

// Analytics: location counts by city/address and heatmap points
const getLocationFieldId = (form, requestedFieldId) => {
  if (requestedFieldId) return requestedFieldId;
  for (const p of form.pages || []) {
    for (const f of p.fields || []) {
      if (f.type === "location") return f.id;
    }
  }
  for (const f of form.fields || []) {
    if (f.type === "location") return f.id;
  }
  return null;
};

const getLocationCounts = async (req, res) => {
  try {
    const { id } = req.params;
    const { fieldId } = req.query;
    const form = await Form.findById(id).select("createdBy fields pages");
    if (!form)
      return res.status(404).json({ success: false, message: "Form not found" });
    if (form.createdBy.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Access denied" });

    const locFieldId = getLocationFieldId(form, fieldId);
    if (!locFieldId)
      return res.status(400).json({ success: false, message: "No location field found on this form" });

    function roundTo3(n) { return Number(n.toFixed(3)); }

    // Fetch responses from separate collection
    const docs = await Response.find({ formId: id }).select("data").lean();

    const counts = new Map();
    for (const resp of docs) {
      const v = resp.data?.[locFieldId];
      if (!v || typeof v !== "object") continue;
      const latRaw = Number(v.lat);
      const lngRaw = Number(v.lng);
      if (!Number.isFinite(latRaw) || !Number.isFinite(lngRaw)) continue;
      const lat = roundTo3(latRaw);
      const lng = roundTo3(lngRaw);
      const city = v.city && String(v.city).trim();
      const address = v.address && String(v.address).trim();
      const key = city || address || `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
      const prev = counts.get(key) || { city: city || null, address: address || null, lat, lng, count: 0 };
      prev.count += 1;
      counts.set(key, prev);
    }
    const items = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    return res.json({ success: true, message: "Location counts computed", data: { fieldId: locFieldId, items } });
  } catch (error) {
    console.error("Error computing location counts:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const getLocationHeatmap = async (req, res) => {
  try {
    const { id } = req.params;
    const { fieldId } = req.query;
    const form = await Form.findById(id).select("createdBy fields pages");
    if (!form)
      return res.status(404).json({ success: false, message: "Form not found" });
    if (form.createdBy.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Access denied" });

    const locFieldId = getLocationFieldId(form, fieldId);
    if (!locFieldId)
      return res.status(400).json({ success: false, message: "No location field found on this form" });

    function roundTo3(n) { return Number(n.toFixed(3)); }

    const docs = await Response.find({ formId: id }).select("data").lean();

    const points = [];
    for (const resp of docs) {
      const v = resp.data?.[locFieldId];
      if (!v || typeof v !== "object") continue;
      const latRaw = Number(v.lat);
      const lngRaw = Number(v.lng);
      if (!Number.isFinite(latRaw) || !Number.isFinite(lngRaw)) continue;
      const lat = roundTo3(latRaw);
      const lng = roundTo3(lngRaw);
      points.push({ lat, lng });
    }
    return res.json({ success: true, message: "Heatmap data computed", data: { fieldId: locFieldId, points } });
  } catch (error) {
    console.error("Error computing heatmap data:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
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
  getLocationCounts,
  getLocationHeatmap,
};
