const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  category: {
    type: String,
    enum: ['general', 'notifications', 'security', 'appearance', 'integrations', 'backup'],
    default: 'general'
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'array', 'object'],
    default: 'string'
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
