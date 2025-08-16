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

module.exports = {
  createForm,
  getAllForms
};
