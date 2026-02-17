const mongoose = require('mongoose');

/**
 * EventRegistration Schema
 * Stores event registrations from users
 */
const eventRegistrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [100, 'First name cannot exceed 100 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [100, 'Last name cannot exceed 100 characters']
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
  accessibilityNeeds: {
    type: String,
    trim: true,
    maxlength: [500, 'Accessibility needs cannot exceed 500 characters']
  },
  ticketId: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'waitlisted'],
    default: 'confirmed'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Generate ticket ID before saving
eventRegistrationSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    const eventDoc = await mongoose.model('Event').findById(this.event);
    const eventPrefix = eventDoc ? eventDoc.slug.substring(0, 3).toUpperCase() : 'EVT';
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.ticketId = `PV-${eventPrefix}-${randomPart}`;
  }
  next();
});

// Index for faster queries
eventRegistrationSchema.index({ event: 1, email: 1 });
eventRegistrationSchema.index({ status: 1 });
eventRegistrationSchema.index({ createdAt: -1 });

// Transform output
eventRegistrationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
