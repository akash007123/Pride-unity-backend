const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Role hierarchy for permission checks
const roleHierarchy = {
  'admin': ['admin', 'sub_admin', 'manager'],
  'sub_admin': ['sub_admin', 'manager'],
  'manager': ['manager']
};

// @desc    Protect routes - verify JWT token
// @route   Middleware
// @access  Private
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
      );

      // Get admin from token
      const admin = await Admin.findById(decoded.id);

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin not found'
        });
      }

      // Check if admin is active
      if (!admin.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated'
        });
      }

      // Attach admin to request
      req.admin = {
        id: admin._id,
        role: admin.role
      };

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// @desc    Check if user has specific role
// @route   Middleware - Usage: authorize('admin', 'sub_admin')
// @access  Private
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.admin.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// @desc    Check if user has minimum role level
// @route   Middleware - Usage: requireMinRole('sub_admin')
// @access  Private
exports.requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const adminRole = req.admin.role;
    const allowedRoles = roleHierarchy[minRole] || [];

    if (!allowedRoles.includes(adminRole)) {
      return res.status(403).json({
        success: false,
        message: `Minimum role '${minRole}' required. Your role: '${adminRole}'`
      });
    }

    next();
  };
};

// @desc    Check if user can access specific resource
// @route   Middleware
// @access  Private
exports.canAccessResource = (resourceOwnerField = 'createdBy') => {
  return async (req, res, next) => {
    try {
      const resource = req.resource;

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Admins can access any resource
      if (req.admin.role === 'admin') {
        return next();
      }

      // Check if user owns the resource
      const ownerId = resource[resourceOwnerField];

      if (ownerId && ownerId.toString() !== req.admin.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }

      next();
    } catch (error) {
      console.error('Resource access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error checking resource access'
      });
    }
  };
};
