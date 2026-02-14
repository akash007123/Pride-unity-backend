const mongoose = require('mongoose');

/**
 * CommunityMember Schema
 * Stores community registration submissions from the JoinCommunityModal frontend component
 */
const communityMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    maxlength: [255, 'Email cannot exceed 255 characters'],
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    maxlength: [20, 'Mobile number cannot exceed 20 characters']
  },
  education: {
    type: String,
    required: [true, 'Education level is required'],
    trim: true,
    enum: [
      'High School',
      'Some College',
      'Associate Degree',
      "Bachelor's Degree",
      "Master's Degree",
      'Doctorate',
      'Other'
    ]
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'archived'],
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
communityMemberSchema.index({ status: 1, createdAt: -1 });
communityMemberSchema.index({ email: 1 });

// Virtual for formatted date
communityMemberSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Transform output
communityMemberSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('CommunityMember', communityMemberSchema);
