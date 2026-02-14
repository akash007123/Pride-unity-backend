const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  register,
  login,
  getProfile,
  logout,
  updateProfile,
  changePassword
} = require('../controllers/adminAuthController');
const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// @route   POST /api/auth/register
// @desc    Register new admin
// @access  Public (add secret key in production for security)
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters'),
    body('mobile')
      .matches(/^\+?[\d\s-]{10,}$/)
      .withMessage('Please provide a valid mobile number'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match'),
    body('dateOfBirth')
      .isISO8601()
      .withMessage('Please provide a valid date of birth'),
    body('gender')
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('Please select a valid gender'),
    body('role')
      .optional()
      .isIn(['admin', 'sub_admin', 'manager'])
      .withMessage('Invalid role')
  ],
  validate,
  register
);

// @route   POST /api/auth/login
// @desc    Login admin
// @access  Public
router.post(
  '/login',
  [
    body('credential').trim().notEmpty().withMessage('Email/Username/Mobile is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  login
);

// @route   GET /api/auth/profile
// @desc    Get current admin profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update admin profile
// @access  Private
router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('mobile')
      .optional()
      .matches(/^\+?[\d\s-]{10,}$/)
      .withMessage('Please provide a valid mobile number'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('Invalid gender')
  ],
  validate,
  updateProfile
);

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put(
  '/password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
    body('confirmNewPassword')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('Passwords do not match')
  ],
  validate,
  changePassword
);

// @route   POST /api/auth/logout
// @desc    Logout admin (for logging purposes)
// @access  Private
router.post('/logout', protect, logout);

module.exports = router;
