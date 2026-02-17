const CustomVolunteer = require('../models/CustomVolunteer');

/**
 * Validation error helper
 * @param {Object} errors - Validation errors object
 * @returns {Object} Formatted error response
 */
const formatValidationErrors = (errors) => {
  const formattedErrors = {};
  errors.forEach(error => {
    formattedErrors[error.path] = error.message;
  });
  return formattedErrors;
};

/**
 * @desc    Create a new custom volunteer
 * @route   POST /api/custom-volunteers
 * @access  Private (Admin, Sub Admin, Volunteer, Member)
 */
const createCustomVolunteer = async (req, res) => {
  try {
    const {
      fullName,
      parentName,
      email,
      mobile,
      alternateMobile,
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      bloodGroup,
      aadhaarNumber,
      socialMediaLinks,
      currentAddress,
      permanentAddress,
      city,
      state,
      country,
      pincode,
      highestQualification,
      fieldOfStudy,
      institutionName,
      yearOfCompletion,
      certifications,
      skills,
      role,
      notes
    } = req.body;

    // Get user info from auth middleware
    const createdBy = req.admin.id;
    const createdByRole = req.admin.role;

    const volunteer = await CustomVolunteer.create({
      fullName,
      parentName,
      email,
      mobile,
      alternateMobile,
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      bloodGroup,
      aadhaarNumber,
      socialMediaLinks,
      currentAddress,
      permanentAddress,
      city,
      state,
      country,
      pincode,
      highestQualification,
      fieldOfStudy,
      institutionName,
      yearOfCompletion,
      certifications,
      skills,
      role,
      notes,
      createdBy,
      createdByRole
    });

    res.status(201).json({
      success: true,
      message: 'Custom volunteer created successfully',
      data: volunteer
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        path: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(errors)
      });
    }

    // Check for duplicate email
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A volunteer with this email already exists'
      });
    }

    console.error('Create custom volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating custom volunteer'
    });
  }
};

/**
 * @desc    Get all custom volunteers with role-based filtering
 * @route   GET /api/custom-volunteers
 * @access  Private (Admin, Sub Admin, Volunteer, Member)
 */
const getCustomVolunteers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    // Get user role from auth middleware
    const userRole = req.admin.role;
    const userId = req.admin.id;

    // Build query based on role
    let query = {};
    
    // Non-admin users can only see volunteers they created
    if (userRole !== 'Admin') {
      query.createdBy = userId;
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search in name, email, and phone
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { volunteerId: { $regex: search, $options: 'i' } }
      ];
    }

    const volunteers = await CustomVolunteer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await CustomVolunteer.countDocuments(query);

    res.json({
      success: true,
      data: volunteers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get custom volunteers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching custom volunteers'
    });
  }
};

/**
 * @desc    Get single custom volunteer by ID
 * @route   GET /api/custom-volunteers/:id
 * @access  Private (Admin, Sub Admin, Volunteer, Member)
 */
const getCustomVolunteerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user role from auth middleware
    const userRole = req.admin.role;
    const userId = req.admin.id;

    const volunteer = await CustomVolunteer.findById(id).populate('createdBy', 'name email');

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Custom volunteer not found'
      });
    }

    // Check access: Admin can view all, others can only view their own
    if (userRole !== 'Admin' && volunteer.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view volunteers you created.'
      });
    }

    res.json({
      success: true,
      data: volunteer
    });

  } catch (error) {
    console.error('Get custom volunteer by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching custom volunteer'
    });
  }
};

/**
 * @desc    Update a custom volunteer
 * @route   PUT /api/custom-volunteers/:id
 * @access  Private (Admin, Sub Admin, Volunteer, Member)
 */
const updateCustomVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user role from auth middleware
    const userRole = req.admin.role;
    const userId = req.admin.id;

    let volunteer = await CustomVolunteer.findById(id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Custom volunteer not found'
      });
    }

    // Check access: Admin can update all, others can only update their own
    if (userRole !== 'Admin' && volunteer.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update volunteers you created.'
      });
    }

    const {
      fullName,
      parentName,
      email,
      mobile,
      alternateMobile,
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      bloodGroup,
      aadhaarNumber,
      socialMediaLinks,
      currentAddress,
      permanentAddress,
      city,
      state,
      country,
      pincode,
      highestQualification,
      fieldOfStudy,
      institutionName,
      yearOfCompletion,
      certifications,
      skills,
      role,
      status,
      notes
    } = req.body;

    // Update fields
    const updateData = {
      fullName,
      parentName,
      email,
      mobile,
      alternateMobile,
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      bloodGroup,
      aadhaarNumber,
      socialMediaLinks,
      currentAddress,
      permanentAddress,
      city,
      state,
      country,
      pincode,
      highestQualification,
      fieldOfStudy,
      institutionName,
      yearOfCompletion,
      certifications,
      skills,
      role,
      status,
      notes
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    volunteer = await CustomVolunteer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Custom volunteer updated successfully',
      data: volunteer
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        path: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(errors)
      });
    }

    console.error('Update custom volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating custom volunteer'
    });
  }
};

/**
 * @desc    Delete a custom volunteer
 * @route   DELETE /api/custom-volunteers/:id
 * @access  Private (Admin, Sub Admin, Volunteer, Member)
 */
const deleteCustomVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user role from auth middleware
    const userRole = req.admin.role;
    const userId = req.admin.id;

    const volunteer = await CustomVolunteer.findById(id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Custom volunteer not found'
      });
    }

    // Check access: Admin can delete all, others can only delete their own
    if (userRole !== 'Admin' && volunteer.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete volunteers you created.'
      });
    }

    await CustomVolunteer.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Custom volunteer deleted successfully'
    });

  } catch (error) {
    console.error('Delete custom volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting custom volunteer'
    });
  }
};

/**
 * @desc    Get custom volunteer statistics
 * @route   GET /api/custom-volunteers/stats
 * @access  Private (Admin, Sub Admin, Volunteer, Member)
 */
const getCustomVolunteerStats = async (req, res) => {
  try {
    // Get user role from auth middleware
    const userRole = req.admin.role;
    const userId = req.admin.id;

    // Build query based on role
    let query = {};
    
    // Non-admin users can only see their own volunteers
    if (userRole !== 'Admin') {
      query.createdBy = userId;
    }

    const total = await CustomVolunteer.countDocuments(query);
    
    const byStatus = await CustomVolunteer.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const byRole = await CustomVolunteer.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const byCity = await CustomVolunteer.aggregate([
      { $match: { ...query, city: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Format the response
    const statusObj = {};
    byStatus.forEach(item => {
      statusObj[item._id || 'unknown'] = item.count;
    });

    const roleObj = {};
    byRole.forEach(item => {
      roleObj[item._id || 'unknown'] = item.count;
    });

    res.json({
      success: true,
      data: {
        total,
        byStatus: statusObj,
        byRole: roleObj,
        byCity
      }
    });

  } catch (error) {
    console.error('Get custom volunteer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching custom volunteer statistics'
    });
  }
};

module.exports = {
  createCustomVolunteer,
  getCustomVolunteers,
  getCustomVolunteerById,
  updateCustomVolunteer,
  deleteCustomVolunteer,
  getCustomVolunteerStats
};
