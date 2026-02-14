const Volunteer = require('../models/Volunteer');

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
 * @desc    Create a new volunteer registration
 * @route   POST /api/volunteers
 * @access  Public
 */
const createVolunteer = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, roles, skills, availability, message, agreedToContact } = req.body;

    const volunteer = await Volunteer.create({
      firstName,
      lastName,
      email,
      phone,
      roles,
      skills,
      availability,
      message,
      agreedToContact
    });

    res.status(201).json({
      success: true,
      message: 'Volunteer registration submitted successfully',
      data: volunteer
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
        message: 'This email has already registered as a volunteer'
      });
    }

    console.error('Create volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating volunteer registration'
    });
  }
};

/**
 * @desc    Get all volunteers
 * @route   GET /api/volunteers
 * @access  Private (Admin)
 */
const getVolunteers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {};

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search in name, email, and phone
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const volunteers = await Volunteer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Volunteer.countDocuments(query);

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
    console.error('Get volunteers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching volunteers'
    });
  }
};

/**
 * @desc    Get a single volunteer by ID
 * @route   GET /api/volunteers/:id
 * @access  Private (Admin)
 */
const getVolunteerById = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    // Mark as contacted when viewed if pending
    if (volunteer.status === 'pending') {
      volunteer.status = 'contacted';
      await volunteer.save();
    }

    res.json({
      success: true,
      data: volunteer
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    console.error('Get volunteer by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching volunteer'
    });
  }
};

/**
 * @desc    Update a volunteer
 * @route   PUT /api/volunteers/:id
 * @access  Private (Admin)
 */
const updateVolunteer = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true, runValidators: true }
    );

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    res.json({
      success: true,
      message: 'Volunteer updated successfully',
      data: volunteer
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    console.error('Update volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating volunteer'
    });
  }
};

/**
 * @desc    Delete a volunteer
 * @route   DELETE /api/volunteers/:id
 * @access  Private (Admin)
 */
const deleteVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    res.json({
      success: true,
      message: 'Volunteer deleted successfully',
      data: { id: req.params.id }
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    console.error('Delete volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting volunteer'
    });
  }
};

/**
 * @desc    Get volunteer statistics
 * @route   GET /api/volunteers/stats
 * @access  Private (Admin)
 */
const getVolunteerStats = async (req, res) => {
  try {
    const stats = await Volunteer.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalVolunteers = await Volunteer.countDocuments();

    // Get role distribution
    const roleStats = await Volunteer.aggregate([
      { $unwind: '$roles' },
      {
        $group: {
          _id: '$roles',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get skills distribution (top 10)
    const skillsStats = await Volunteer.aggregate([
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const roleCounts = roleStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const skillsCounts = skillsStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: totalVolunteers,
        byStatus: statusCounts,
        byRoles: roleCounts,
        topSkills: skillsCounts
      }
    });

  } catch (error) {
    console.error('Get volunteer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching volunteer statistics'
    });
  }
};

module.exports = {
  createVolunteer,
  getVolunteers,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer,
  getVolunteerStats
};
