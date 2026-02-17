const mongoose = require('mongoose');

/**
 * Event Schema
 * Stores events for the Pride platform with registration support
 */
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  fullDescription: {
    type: String,
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Event date is required'],
    trim: true
  },
  time: {
    type: String,
    required: [true, 'Event time is required'],
    trim: true
  },
  endDate: {
    type: String,
    trim: true
  },
  endTime: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
    maxlength: [500, 'Location cannot exceed 500 characters']
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  meetingLink: {
    type: String,
    trim: true
  },
  organizer: {
    name: {
      type: String,
      required: [true, 'Organizer name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  isFree: {
    type: Boolean,
    default: true
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  maxAttendees: {
    type: Number,
    default: null,
    min: [1, 'Maximum attendees must be at least 1']
  },
  currentAttendees: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    trim: true
  },
  schedule: [{
    time: {
      type: String,
      required: true
    },
    event: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  registrationOpen: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate slug before saving
eventSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual for formatted date
eventSchema.virtual('formattedDate').get(function() {
  return this.date;
});

// Virtual for spots left
eventSchema.virtual('spotsLeft').get(function() {
  if (!this.maxAttendees) return null;
  return this.maxAttendees - this.currentAttendees;
});

// Virtual for isSoldOut
eventSchema.virtual('isSoldOut').get(function() {
  if (!this.maxAttendees) return false;
  return this.currentAttendees >= this.maxAttendees;
});

// Index for faster queries
eventSchema.index({ status: 1, featured: -1, date: 1 });
eventSchema.index({ tags: 1 });

// Transform output
eventSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Event', eventSchema);
