const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

/**
 * @route   POST /api/contacts
 * @desc    Create a new contact message (Public)
 * @access  Public
 */
router.post('/', contactController.createContact);

/**
 * @route   GET /api/contacts
 * @desc    Get all contact messages with pagination and filtering
 * @access  Private (Admin)
 */
router.get('/', contactController.getContacts);

/**
 * @route   GET /api/contacts/stats
 * @desc    Get contact message statistics
 * @access  Private (Admin)
 */
router.get('/stats', contactController.getContactStats);

/**
 * @route   GET /api/contacts/:id
 * @desc    Get a single contact message by ID
 * @access  Private (Admin)
 */
router.get('/:id', contactController.getContactById);

/**
 * @route   PUT /api/contacts/:id
 * @desc    Update a contact message (status, notes)
 * @access  Private (Admin)
 */
router.put('/:id', contactController.updateContact);

/**
 * @route   DELETE /api/contacts/:id
 * @desc    Delete a contact message
 * @access  Private (Admin)
 */
router.delete('/:id', contactController.deleteContact);

module.exports = router;
