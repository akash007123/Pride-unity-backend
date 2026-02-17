const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getSettings,
  getSettingByKey,
  updateSetting,
  updateSettings,
  seedSettings,
  getSettingsStats
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get all settings
// @access  Private (Admin only)
router.get('/', protect, authorize('Admin'), getSettings);

// @route   GET /api/settings/stats
// @desc    Get settings statistics
// @access  Private (Admin only)
router.get('/stats', protect, authorize('Admin'), getSettingsStats);

// @route   GET /api/settings/:key
// @desc    Get single setting by key
// @access  Private (Admin only)
router.get('/:key', protect, authorize('Admin'), getSettingByKey);

// @route   PUT /api/settings/:key
// @desc    Update a single setting
// @access  Private (Admin only)
router.put(
  '/:key',
  protect,
  authorize('Admin'),
  [
    body('value').notEmpty().withMessage('Value is required')
  ],
  updateSetting
);

// @route   PUT /api/settings
// @desc    Update multiple settings
// @access  Private (Admin only)
router.put(
  '/',
  protect,
  authorize('Admin'),
  [
    body('settings').isArray({ min: 1 }).withMessage('Settings must be an array')
  ],
  updateSettings
);

// @route   POST /api/settings/seed
// @desc    Seed default settings
// @access  Private (Admin only)
router.post('/seed', protect, authorize('Admin'), seedSettings);

module.exports = router;
