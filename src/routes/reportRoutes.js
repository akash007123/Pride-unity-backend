const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getReports,
  getReportById,
  generateReport,
  deleteReport,
  getReportStats
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/reports
// @desc    Get all reports
// @access  Private (Admin only)
router.get('/', protect, authorize('Admin'), getReports);

// @route   GET /api/reports/stats
// @desc    Get report statistics
// @access  Private (Admin only)
router.get('/stats', protect, authorize('Admin'), getReportStats);

// @route   GET /api/reports/:id
// @desc    Get single report
// @access  Private (Admin only)
router.get('/:id', protect, authorize('Admin'), getReportById);

// @route   POST /api/reports/generate
// @desc    Generate a new report
// @access  Private (Admin only)
router.post(
  '/generate',
  protect,
  authorize('Admin'),
  [
    body('type').isIn(['activity', 'user', 'contact', 'volunteer', 'event', 'financial'])
      .withMessage('Please provide a valid report type'),
    body('title').optional().trim(),
    body('description').optional().trim()
  ],
  generateReport
);

// @route   DELETE /api/reports/:id
// @desc    Delete a report
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('Admin'), deleteReport);

module.exports = router;
