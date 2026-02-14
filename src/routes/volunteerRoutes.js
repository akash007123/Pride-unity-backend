const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');

/**
 * @route   POST /api/volunteers
 * @desc    Create a new volunteer registration (Public)
 * @access  Public
 */
router.post('/', volunteerController.createVolunteer);

/**
 * @route   GET /api/volunteers
 * @desc    Get all volunteers with pagination and filtering
 * @access  Private (Admin)
 */
router.get('/', volunteerController.getVolunteers);

/**
 * @route   GET /api/volunteers/stats
 * @desc    Get volunteer statistics
 * @access  Private (Admin)
 */
router.get('/stats', volunteerController.getVolunteerStats);

/**
 * @route   GET /api/volunteers/:id
 * @desc    Get a single volunteer by ID
 * @access  Private (Admin)
 */
router.get('/:id', volunteerController.getVolunteerById);

/**
 * @route   PUT /api/volunteers/:id
 * @desc    Update a volunteer (status, notes)
 * @access  Private (Admin)
 */
router.put('/:id', volunteerController.updateVolunteer);

/**
 * @route   DELETE /api/volunteers/:id
 * @desc    Delete a volunteer
 * @access  Private (Admin)
 */
router.delete('/:id', volunteerController.deleteVolunteer);

module.exports = router;
