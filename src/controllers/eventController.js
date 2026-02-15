const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');

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
 * @desc    Create a new event
 * @route   POST /api/events
 * @access  Private (Admin)
 */
const createEvent = async (req, res) => {
  try {
    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
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

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An event with this title already exists'
      });
    }

    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating event'
    });
  }
};

/**
 * @desc    Get all events (public - published only)
 * @route   GET /api/events
 * @access  Public
 */
const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, featured, status = 'published' } = req.query;

    const query = {};

    // For public access, only show published events
    if (status !== 'all') {
      query.status = status;
    }

    // Filter by featured
    if (featured === 'true') {
      query.featured = true;
    }

    const events = await Event.find(query)
      .sort({ featured: -1, date: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-fullDescription');

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
    });
  }
};

/**
 * @desc    Get all events for admin (including drafts)
 * @route   GET /api/events/admin
 * @access  Private (Admin)
 */
const getAdminEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};

    // Admin can see all statuses
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get admin events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
    });
  }
};

/**
 * @desc    Get a single event by ID or slug
 * @route   GET /api/events/:idOrSlug
 * @access  Public
 */
const getEventById = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    // Try to find by ID first, then by slug
    let event;
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findById(idOrSlug);
    } else {
      event = await Event.findOne({ slug: idOrSlug });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    console.error('Get event by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching event'
    });
  }
};

/**
 * @desc    Update an event
 * @route   PUT /api/events/:id
 * @access  Private (Admin)
 */
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

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

    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating event'
    });
  }
};

/**
 * @desc    Delete an event
 * @route   DELETE /api/events/:id
 * @access  Private (Admin)
 */
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Also delete all registrations for this event
    await EventRegistration.deleteMany({ event: req.params.id });

    res.json({
      success: true,
      message: 'Event deleted successfully',
      data: { id: req.params.id }
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting event'
    });
  }
};

/**
 * @desc    Register for an event
 * @route   POST /api/events/:id/register
 * @access  Public
 */
const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, accessibilityNeeds } = req.body;

    // Find the event
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is published and registration is open
    if (event.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Registration is not open for this event'
      });
    }

    if (!event.registrationOpen) {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed for this event'
      });
    }

    // Check if already registered
    const existingRegistration = await EventRegistration.findOne({ event: id, email });
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Check capacity
    if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
      // Create waitlist registration
      const registration = await EventRegistration.create({
        event: id,
        firstName,
        lastName,
        email,
        phone,
        accessibilityNeeds,
        status: 'waitlisted',
        amount: event.isFree ? 0 : event.price
      });

      return res.status(201).json({
        success: true,
        message: 'Event is full. You have been added to the waitlist.',
        data: {
          ...registration.toObject(),
          isWaitlisted: true
        }
      });
    }

    // Create registration
    const registration = await EventRegistration.create({
      event: id,
      firstName,
      lastName,
      email,
      phone,
      accessibilityNeeds,
      amount: event.isFree ? 0 : event.price,
      paymentStatus: event.isFree ? 'paid' : 'pending'
    });

    // Increment attendee count
    await Event.findByIdAndUpdate(id, { $inc: { currentAttendees: 1 } });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: registration
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

    console.error('Register for event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while registering for event'
    });
  }
};

/**
 * @desc    Get event registrations (admin)
 * @route   GET /api/events/:id/registrations
 * @access  Private (Admin)
 */
const getEventRegistrations = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const query = { event: id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const registrations = await EventRegistration.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await EventRegistration.countDocuments(query);

    res.json({
      success: true,
      data: registrations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get event registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching registrations'
    });
  }
};

/**
 * @desc    Get all registrations (admin)
 * @route   GET /api/events/registrations
 * @access  Private (Admin)
 */
const getAllRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, eventId } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (eventId) {
      query.event = eventId;
    }

    const registrations = await EventRegistration.find(query)
      .populate('event', 'title date slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await EventRegistration.countDocuments(query);

    res.json({
      success: true,
      data: registrations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching registrations'
    });
  }
};

/**
 * @desc    Cancel registration
 * @route   POST /api/events/registrations/:id/cancel
 * @access  Public
 */
const cancelRegistration = async (req, res) => {
  try {
    const registration = await EventRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Update registration status
    registration.status = 'cancelled';
    await registration.save();

    // Decrement attendee count
    await Event.findByIdAndUpdate(registration.event, { $inc: { currentAttendees: -1 } });

    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling registration'
    });
  }
};

/**
 * @desc    Get event statistics
 * @route   GET /api/events/stats
 * @access  Private (Admin)
 */
const getEventStats = async (req, res) => {
  try {
    const stats = await Event.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await EventRegistration.countDocuments();
    const totalAttendees = await EventRegistration.countDocuments({ status: 'confirmed' });

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: totalEvents,
        byStatus: statusCounts,
        totalRegistrations,
        totalAttendees
      }
    });

  } catch (error) {
    console.error('Get event stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching event statistics'
    });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getAdminEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getEventRegistrations,
  getAllRegistrations,
  cancelRegistration,
  getEventStats
};
