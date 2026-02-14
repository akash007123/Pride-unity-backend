const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');

/**
 * @route   POST /api/community
 * @desc    Create a new community member registration (Public)
 * @access  Public
 */
router.post('/', communityController.createCommunityMember);

/**
 * @route   GET /api/community
 * @desc    Get all community members with pagination and filtering
 * @access  Private (Admin)
 */
router.get('/', communityController.getCommunityMembers);

/**
 * @route   GET /api/community/stats
 * @desc    Get community member statistics
 * @access  Private (Admin)
 */
router.get('/stats', communityController.getCommunityStats);

/**
 * @route   GET /api/community/:id
 * @desc    Get a single community member by ID
 * @access  Private (Admin)
 */
router.get('/:id', communityController.getCommunityMemberById);

/**
 * @route   PUT /api/community/:id
 * @desc    Update a community member (status, notes)
 * @access  Private (Admin)
 */
router.put('/:id', communityController.updateCommunityMember);

/**
 * @route   DELETE /api/community/:id
 * @desc    Delete a community member
 * @access  Private (Admin)
 */
router.delete('/:id', communityController.deleteCommunityMember);

module.exports = router;
