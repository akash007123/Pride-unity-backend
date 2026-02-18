const Newsletter = require('../models/Newsletter');

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter
// @access  Public
const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email: email.toLowerCase() });

    if (existingSubscriber) {
      if (existingSubscriber.status === 'unsubscribed') {
        // Re-subscribe
        existingSubscriber.status = 'active';
        await existingSubscriber.save();
        
        return res.status(200).json({
          success: true,
          message: 'Successfully re-subscribed to newsletter'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'This email is already subscribed'
      });
    }

    // Create new subscription
    const subscriber = await Newsletter.create({
      email: email.toLowerCase(),
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: subscriber
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all newsletter subscribers
// @route   GET /api/newsletter
// @access  Private (Admin)
const getAllSubscribers = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const total = await Newsletter.countDocuments(query);
    const subscribers = await Newsletter.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: subscribers.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: subscribers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete newsletter subscriber
// @route   DELETE /api/newsletter/:id
// @access  Private (Admin)
const deleteSubscriber = async (req, res, next) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    await subscriber.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subscriber deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unsubscribe from newsletter
// @route   PUT /api/newsletter/unsubscribe/:id
// @access  Private
const unsubscribe = async (req, res, next) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    subscriber.status = 'unsubscribed';
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export all subscribers
// @route   GET /api/newsletter/export
// @access  Private (Admin)
const exportSubscribers = async (req, res, next) => {
  try {
    const subscribers = await Newsletter.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .select('email status createdAt');

    // Create CSV data
    const csvData = [
      ['Email', 'Status', 'Subscribed Date'],
      ...subscribers.map(sub => [
        sub.email,
        sub.status,
        new Date(sub.createdAt).toLocaleDateString()
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=newsletter-subscribers-${Date.now()}.csv`);
    
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  subscribe,
  getAllSubscribers,
  deleteSubscriber,
  unsubscribe,
  exportSubscribers
};
