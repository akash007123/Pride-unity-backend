const Contact = require('../models/Contact');

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
 * @desc    Create a new contact message
 * @route   POST /api/contacts
 * @access  Public
 */
const createContact = async (req, res) => {
  try {
    const { name, email, subject, mobile, message } = req.body;

    const contact = await Contact.create({
      name,
      email,
      subject,
      mobile,
      message
    });

    res.status(201).json({
      success: true,
      message: 'Contact message created successfully',
      data: contact
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

    console.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating contact message'
    });
  }
};

/**
 * @desc    Get all contact messages
 * @route   GET /api/contacts
 * @access  Private (Admin)
 */
const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {};

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search in name, email, subject, and message
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contacts'
    });
  }
};

/**
 * @desc    Get a single contact message by ID
 * @route   GET /api/contacts/:id
 * @access  Private (Admin)
 */
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    // Mark as read when viewed
    if (contact.status === 'new') {
      contact.status = 'read';
      await contact.save();
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    console.error('Get contact by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contact'
    });
  }
};

/**
 * @desc    Update a contact message
 * @route   PUT /api/contacts/:id
 * @access  Private (Admin)
 */
const updateContact = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact message updated successfully',
      data: contact
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating contact'
    });
  }
};

/**
 * @desc    Delete a contact message
 * @route   DELETE /api/contacts/:id
 * @access  Private (Admin)
 */
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact message deleted successfully',
      data: { id: req.params.id }
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting contact'
    });
  }
};

/**
 * @desc    Get contact statistics
 * @route   GET /api/contacts/stats
 * @access  Private (Admin)
 */
const getContactStats = async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalContacts = await Contact.countDocuments();

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: totalContacts,
        byStatus: statusCounts
      }
    });

  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contact statistics'
    });
  }
};

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats
};
