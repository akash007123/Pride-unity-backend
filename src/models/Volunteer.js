const mongoose = require('mongoose');

/**
 * Volunteer Schema
 * Stores volunteer sign-up submissions from the VolunteerSignupForm frontend component
 */
const volunteerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    maxlength: [255, 'Email cannot exceed 255 characters'],
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  roles: [{
    type: String,
    enum: ['events', 'outreach', 'tech', 'creative']
  }],
  skills: [{
    type: String,
    trim: true
  }],
  availability: {
    type: String,
    trim: true,
    maxlength: [100, 'Availability cannot exceed 100 characters']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  agreedToContact: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'approved', 'rejected', 'archived'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Index for faster queries
volunteerSchema.index({ status: 1, createdAt: -1 });
volunteerSchema.index({ email: 1 });

// Virtual for full name
volunteerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for formatted date
volunteerSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Transform output
volunteerSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    ret.fullName = `${ret.firstName} ${ret.lastName}`;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Volunteer', volunteerSchema);
