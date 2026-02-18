const express = require('express');
const router = express.Router();
const {
  subscribe,
  getAllSubscribers,
  deleteSubscriber,
  unsubscribe,
  exportSubscribers
} = require('../controllers/newsletterController');

/**
 * @route   POST /api/newsletter
 * @desc    Subscribe to newsletter (Public)
 * @access  Public
 */
router.post('/', subscribe);

/**
 * @route   GET /api/newsletter
 * @desc    Get all newsletter subscribers
 * @access  Private (Admin)
 */
router.get('/', getAllSubscribers);

/**
 * @route   GET /api/newsletter/export
 * @desc    Export all subscribers as CSV
 * @access  Private (Admin)
 */
router.get('/export', exportSubscribers);

/**
 * @route   DELETE /api/newsletter/:id
 * @desc    Delete a newsletter subscriber
 * @access  Private (Admin)
 */
router.delete('/:id', deleteSubscriber);

/**
 * @route   PUT /api/newsletter/unsubscribe/:id
 * @desc    Unsubscribe from newsletter
 * @access  Private
 */
router.put('/unsubscribe/:id', unsubscribe);

module.exports = router;
