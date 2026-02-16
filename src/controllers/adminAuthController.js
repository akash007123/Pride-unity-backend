const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Register new admin
// @route   POST /api/auth/register
// @access  Public (in production, make this protected or use a secret key)
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      username,
      mobile,
      password,
      confirmPassword,
      dateOfBirth,
      gender,
      address,
      profilePic,
      role
    } = req.body;

    // Validate passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }, { mobile }]
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email, username, or mobile already exists'
      });
    }

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      username,
      mobile,
      password,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      address: address || {},
      profilePic: profilePic || '',
      role: role || 'Member' // Default role
    });

    // Generate token
    const token = generateToken(admin._id, admin.role);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          username: admin.username,
          mobile: admin.mobile,
          profilePic: admin.profilePic,
          role: admin.role,
          isActive: admin.isActive,
          createdAt: admin.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { credential, password } = req.body;

    // Validate input
    if (!credential || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username/mobile and password'
      });
    }

    // Find admin by email, username, or mobile
    const admin = await Admin.findOne({
      $or: [
        { email: credential },
        { username: credential },
        { mobile: credential }
      ]
    }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(admin._id, admin.role);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          username: admin.username,
          mobile: admin.mobile,
          profilePic: admin.profilePic,
          role: admin.role,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current admin profile
// @route   GET /api/auth/profile
// @access  Private (requires JWT)
exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          username: admin.username,
          mobile: admin.mobile,
          profilePic: admin.profilePic,
          dateOfBirth: admin.dateOfBirth,
          gender: admin.gender,
          address: admin.address,
          role: admin.role,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// @desc    Logout admin (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, mobile, dateOfBirth, gender, address, profilePic } = req.body;

    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      {
        name,
        mobile,
        dateOfBirth,
        gender,
        address,
        profilePic
      },
      { new: true, runValidators: true }
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { admin }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    const admin = await Admin.findById(req.admin.id).select('+password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

// @desc    Get all admins
// @route   GET /api/auth/admins
// @access  Private (Admin only)
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        admins
      }
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching admins'
    });
  }
};

// @desc    Get admin by ID
// @route   GET /api/auth/admins/:id
// @access  Private (Admin only)
exports.getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: { admin }
    });
  } catch (error) {
    console.error('Get admin by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching admin'
    });
  }
};

// @desc    Update admin
// @route   PUT /api/auth/admins/:id
// @access  Private (Admin only)
exports.updateAdmin = async (req, res) => {
  try {
    const { name, mobile, role, isActive, newPassword } = req.body;

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent self-deactivation
    if (req.params.id === req.admin.id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    // Update fields
    if (name) admin.name = name;
    if (mobile) admin.mobile = mobile;
    if (role) admin.role = role;
    if (isActive !== undefined) admin.isActive = isActive;

    // Handle profile picture upload
    if (req.file) {
      admin.profilePic = `/uploads/${req.file.filename}`;
    }

    // Handle password change
    if (newPassword) {
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters'
        });
      }
      admin.password = newPassword;
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: { admin: admin.toObject() }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating admin'
    });
  }
};

// @desc    Toggle admin status (activate/deactivate)
// @route   PUT /api/auth/admins/:id/toggle-status
// @access  Private (Admin only)
exports.toggleAdminStatus = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent self-deactivation
    if (req.params.id === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot toggle your own status'
      });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.json({
      success: true,
      message: admin.isActive ? 'Admin activated successfully' : 'Admin deactivated successfully',
      data: { admin: admin.toObject() }
    });
  } catch (error) {
    console.error('Toggle admin status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling admin status'
    });
  }
};

// @desc    Delete admin
// @route   DELETE /api/auth/admins/:id
// @access  Private (Admin only)
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent self-deletion
    if (req.params.id === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting admin'
    });
  }
};
