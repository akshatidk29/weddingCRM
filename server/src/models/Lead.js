import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['note', 'call', 'email', 'meeting', 'status_change', 'assignment'],
    required: true
  },
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lead name is required'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  source: {
    type: String,
    enum: ['referral', 'website', 'social_media', 'advertisement', 'walk_in', 'other'],
    default: 'other'
  },
  stage: {
    type: String,
    enum: ['inquiry', 'proposal', 'negotiation', 'booked', 'lost'],
    default: 'inquiry'
  },
  estimatedBudget: {
    type: Number,
    default: 0
  },
  weddingDate: Date,
  venue: String,
  guestCount: Number,
  notes: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  followUpDate: Date,
  activities: [activitySchema],
  convertedToWedding: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wedding',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

leadSchema.index({ stage: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ createdAt: -1 });

export default mongoose.model('Lead', leadSchema);
