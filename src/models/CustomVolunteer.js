const mongoose = require('mongoose');

/**
 * CustomVolunteer Schema
 * Stores custom volunteer records created by admins with role-based access control
 */
const customVolunteerSchema = new mongoose.Schema({
  // Basic Information
  volunteerId: {
    type: String,
    unique: true,
    trim: true,
    default: function() {
      // This will be set in pre-save hook if not provided
      return undefined;
    }
  },
  profilePhoto: {
    type: String,
    default: null
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  parentName: {
    type: String,
    trim: true,
    maxlength: [100, 'Parent name cannot exceed 100 characters']
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
  alternateMobile: {
    type: String,
    trim: true,
    maxlength: [20, 'Alternate mobile number cannot exceed 20 characters']
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  age: {
    type: Number,
    default: null,
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age cannot exceed 150']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Transgender', 'Other', 'Prefer not to say'],
    default: 'Prefer not to say'
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'],
    default: 'Single'
  },
  nationality: {
    type: String,
    trim: true,
    maxlength: [50, 'Nationality cannot exceed 50 characters'],
    default: 'Indian'
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  aadhaarNumber: {
    type: String,
    trim: true,
    maxlength: [20, 'Aadhaar number cannot exceed 20 characters']
  },
  socialMediaLinks: {
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    other: { type: String, trim: true }
  },

  // Address Information
  currentAddress: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  permanentAddress: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  state: {
    type: String,
    trim: true,
    maxlength: [100, 'State cannot exceed 100 characters']
  },
  country: {
    type: String,
    trim: true,
    maxlength: [100, 'Country cannot exceed 100 characters'],
    default: 'India'
  },
  pincode: {
    type: String,
    trim: true,
    maxlength: [10, 'Pincode cannot exceed 10 characters']
  },

  // Education Details
  highestQualification: {
    type: String,
    trim: true,
    maxlength: [200, 'Qualification cannot exceed 200 characters']
  },
  fieldOfStudy: {
    type: String,
    trim: true,
    maxlength: [200, 'Field of study cannot exceed 200 characters']
  },
  institutionName: {
    type: String,
    trim: true,
    maxlength: [200, 'Institution name cannot exceed 200 characters']
  },
  yearOfCompletion: {
    type: Number,
    min: [1900, 'Year must be valid'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  certifications: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],

  // Role & Status
  role: {
    type: String,
    enum: ['Volunteer', 'Member', 'Coordinator', 'Leader'],
    default: 'Volunteer'
  },

  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Created by is required']
  },
  createdByRole: {
    type: String,
    required: [true, 'Created by role is required'],
    enum: ['Admin', 'Sub Admin', 'Volunteer', 'Member']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
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
customVolunteerSchema.index({ createdBy: 1 });
customVolunteerSchema.index({ createdByRole: 1 });
customVolunteerSchema.index({ status: 1, createdAt: -1 });
customVolunteerSchema.index({ fullName: 'text', email: 'text', mobile: 'text' });

// Auto-generate volunteer ID before saving
customVolunteerSchema.pre('save', async function(next) {
  if (!this.volunteerId) {
    const count = await mongoose.model('CustomVolunteer').countDocuments();
    this.volunteerId = `CV-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Calculate age from date of birth
customVolunteerSchema.pre('save', function(next) {
  if (this.dateOfBirth && !this.age) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
  }
  next();
});

// Transform output
customVolunteerSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('CustomVolunteer', customVolunteerSchema);
