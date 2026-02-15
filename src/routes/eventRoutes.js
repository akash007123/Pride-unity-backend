const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

/**
 * Public Routes
 */

// Get all published events
router.get('/', eventController.getEvents);

// Get event by ID or slug
router.get('/:idOrSlug', eventController.getEventById);

// Register for an event
router.post('/:id/register', eventController.registerForEvent);

/**
 * Admin Routes (protected)
 */

// Get event statistics (must be before /:id routes)
router.get('/stats', protect, eventController.getEventStats);

// Get all registrations (admin)
router.get('/registrations', protect, eventController.getAllRegistrations);

// Get all events (admin - includes drafts)
router.get('/admin/all', protect, eventController.getAdminEvents);

// Get registrations for a specific event (admin) - must be before /:id
router.get('/:id/registrations', protect, eventController.getEventRegistrations);

// Create a new event
router.post('/', protect, eventController.createEvent);

// Update an event
router.put('/:id', protect, eventController.updateEvent);

// Delete an event
router.delete('/:id', protect, eventController.deleteEvent);

// Cancel a registration
router.post('/registrations/:id/cancel', eventController.cancelRegistration);

module.exports = router;
