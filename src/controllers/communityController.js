const CommunityMember = require('../models/CommunityMember');

/**
 * Validation error helper
 * @param {Object} errors - Validation errors object
 * @returns {Object} Formatted error response
 */
const formatValidationErrors = (errors) => {
  const formattedErrors = {};
  errors.forEach(error => {
    formattedErrors[error.path] = error.msg;
  });
  return formattedErrors;
};

/**
 * @desc    Create a new community member registration
 * @route   POST /api/community
 * @access  Public
 */
const createCommunityMember = async (req, res) => {
  try {
    const { name, email, mobile, education } = req.body;

    const member = await CommunityMember.create({
      name,
      email,
      mobile,
      education
    });

    res.status(201).json({
      success: true,
      message: 'Community registration submitted successfully',
      data: member
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        path: err.path,
        msg: err.message
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
        message: 'This email has already registered for the community'
      });
    }

    console.error('Create community member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating community member'
    });
  }
};

/**
 * @desc    Get all community members
 * @route   GET /api/community
 * @access  Private (Admin)
 */
const getCommunityMembers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {};

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search in name, email, and mobile
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const members = await CommunityMember.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CommunityMember.countDocuments(query);

    res.json({
      success: true,
      data: members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get community members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching community members'
    });
  }
};

/**
 * @desc    Get a single community member by ID
 * @route   GET /api/community/:id
 * @access  Private (Admin)
 */
const getCommunityMemberById = async (req, res) => {
  try {
    const member = await CommunityMember.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Community member not found'
      });
    }

    // Mark as approved when viewed if pending
    if (member.status === 'pending') {
      member.status = 'approved';
      await member.save();
    }

    res.json({
      success: true,
      data: member
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Community member not found'
      });
    }

    console.error('Get community member by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching community member'
    });
  }
};

/**
 * @desc    Update a community member
 * @route   PUT /api/community/:id
 * @access  Private (Admin)
 */
const updateCommunityMember = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const member = await CommunityMember.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Community member not found'
      });
    }

    res.json({
      success: true,
      message: 'Community member updated successfully',
      data: member
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Community member not found'
      });
    }

    console.error('Update community member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating community member'
    });
  }
};

/**
 * @desc    Delete a community member
 * @route   DELETE /api/community/:id
 * @access  Private (Admin)
 */
const deleteCommunityMember = async (req, res) => {
  try {
    const member = await CommunityMember.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Community member not found'
      });
    }

    res.json({
      success: true,
      message: 'Community member deleted successfully',
      data: { id: req.params.id }
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Community member not found'
      });
    }

    console.error('Delete community member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting community member'
    });
  }
};

/**
 * @desc    Get community member statistics
 * @route   GET /api/community/stats
 * @access  Private (Admin)
 */
const getCommunityStats = async (req, res) => {
  try {
    const stats = await CommunityMember.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalMembers = await CommunityMember.countDocuments();

    // Get education level distribution
    const educationStats = await CommunityMember.aggregate([
      {
        $group: {
          _id: '$education',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const educationCounts = educationStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: totalMembers,
        byStatus: statusCounts,
        byEducation: educationCounts
      }
    });

  } catch (error) {
    console.error('Get community stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching community statistics'
    });
  }
};

module.exports = {
  createCommunityMember,
  getCommunityMembers,
  getCommunityMemberById,
  updateCommunityMember,
  deleteCommunityMember,
  getCommunityStats
};
