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

// READ - Get all forms for the authenticated user
const getAllForms = async (req, res) => {
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

    // Extract query parameters with default values
    const {
      page = 1,           // Default to first page
      limit = 10,         // Default 10 forms per page
      status = 'all',     // Default to show all statuses
      search = '',        // Default empty search
      sortBy = 'updatedAt', // Default sort by last updated
      sortOrder = 'desc'  // Default newest first
    } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build the query object
    let query = {
      createdBy: req.user.id // Only get forms created by this user
    };

    // Add status filter if not 'all'
    if (status !== 'all') {
      query.status = status;
    }

    // Add search functionality (searches in title)
    if (search.trim()) {
      query.title = {
        $regex: search.trim(), // MongoDB regex for partial matching
        $options: 'i'          // Case-insensitive search
      };
    }

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute the query with pagination
    const [forms, totalCount] = await Promise.all([
      Form.find(query)
        .sort(sortObject)
        .skip(skip)
        .limit(limitNumber)
        .select('-__v') // Exclude version key from response
        .populate('createdBy', 'name email') // Include creator info
        .lean(), // Returns plain JavaScript objects (better performance)
      
      Form.countDocuments(query) // Get total count for pagination
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;

    // Transform forms data (add computed fields)
    const transformedForms = forms.map(form => ({
      ...form,
      responseCount: form.responses ? form.responses.length : 0,
      lastResponseAt: form.responses && form.responses.length > 0 
        ? new Date(Math.max(...form.responses.map(r => new Date(r.submittedAt))))
        : null,
      fieldCount: form.fields ? form.fields.length : 0
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
          hasPreviousPage
        },
        filters: {
          status: status,
          search: search,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error("Error retrieving forms:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error.message 
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
        errors: errors.array() 
      });
    }

    // Extract form ID from URL parameters
    const { id } = req.params;

    // Find the form by ID with additional data
    const form = await Form.findById(id)
      .select('-__v') // Exclude MongoDB version key
      .populate('createdBy', 'name email avatar') // Include creator details
      .lean(); // Return plain JavaScript object for better performance

    // Check if form exists
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    // Security check: Ensure user can only access their own forms
    // Convert ObjectId to string for comparison
    if (form.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own forms."
      });
    }

    // Enrich form data with computed fields
    const enrichedForm = {
      ...form,
      
      // Response analytics
      responseCount: form.responses ? form.responses.length : 0,
      lastResponseAt: form.responses && form.responses.length > 0 
        ? new Date(Math.max(...form.responses.map(r => new Date(r.submittedAt))))
        : null,
      
      // Field analytics
      fieldCount: form.fields ? form.fields.length : 0,
      requiredFieldCount: form.fields ? form.fields.filter(field => field.required).length : 0,
      
      // Form status information
      isPublished: form.status === 'published',
      isDraft: form.status === 'draft',
      isClosed: form.status === 'closed',
      
      // Time calculations
      daysSinceCreated: Math.floor((new Date() - new Date(form.createdAt)) / (1000 * 60 * 60 * 24)),
      daysSinceUpdated: Math.floor((new Date() - new Date(form.updatedAt)) / (1000 * 60 * 60 * 24)),
      
      // Response rate calculation (if form is published)
      responseRate: form.status === 'published' && form.views > 0 
        ? ((form.responses?.length || 0) / form.views * 100).toFixed(2)
        : null,
        
      // Field type breakdown
      fieldTypeBreakdown: form.fields ? form.fields.reduce((acc, field) => {
        acc[field.type] = (acc[field.type] || 0) + 1;
        return acc;
      }, {}) : {},
      
      // Recent responses (last 5)
      recentResponses: form.responses 
        ? form.responses
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
            .slice(0, 5)
            .map(response => ({
              id: response.id,
              submittedAt: response.submittedAt,
              responsePreview: Object.keys(response.data).length > 0 
                ? `${Object.keys(response.data).length} fields completed`
                : 'Empty response'
            }))
        : []
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
      data: enrichedForm
    });

  } catch (error) {
    console.error("Error retrieving form:", error);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid form ID format"
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error.message 
    });
  }
};

module.exports = {
  createForm,
  getAllForms,
  getFormById
};
