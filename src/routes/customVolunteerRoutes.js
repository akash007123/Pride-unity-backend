const express = require('express');
const router = express.Router();
const customVolunteerController = require('../controllers/customVolunteerController');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/custom-volunteers
 * @desc    Create a new custom volunteer
 * @access  Private (Admin, Sub Admin, Volunteer, Member)
 */
router.post('/', auth.protect, customVolunteerController.createCustomVolunteer);

/**
 * @route   GET /api/custom-volunteers
 * @desc    Get all custom volunteers with role-based filtering
 * @access  Private (Admin, Sub Admin, Volunteer, Member)
 */
router.get('/', auth.protect, customVolunteerController.getCustomVolunteers);

/**
 * @route   GET /api/custom-volunteers/stats
 * @desc    Get custom volunteer statistics
 * @access  Private (Admin, Sub Admin, Volunteer, Member)
 */
router.get('/stats', auth.protect, customVolunteerController.getCustomVolunteerStats);

/**
 * @route   GET /api/custom-volunteers/:id
 * @desc    Get a single custom volunteer by ID
 * @access  Private (Admin, Sub Admin, Volunteer, Member)
 */
router.get('/:id', auth.protect, customVolunteerController.getCustomVolunteerById);

/**
 * @route   PUT /api/custom-volunteers/:id
 * @desc    Update a custom volunteer
 * @access  Private (Admin, Sub Admin, Volunteer, Member)
 */
router.put('/:id', auth.protect, customVolunteerController.updateCustomVolunteer);

/**
 * @route   DELETE /api/custom-volunteers/:id
 * @desc    Delete a custom volunteer
 * @access  Private (Admin, Sub Admin, Volunteer, Member)
 */
router.delete('/:id', auth.protect, customVolunteerController.deleteCustomVolunteer);

module.exports = router;
