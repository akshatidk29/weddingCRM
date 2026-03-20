import mongoose from 'mongoose';

const weddingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Wedding name is required'],
    trim: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  clientEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address']
  },
  clientPhone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be exactly 10 digits'
    }
  },
  weddingDate: {
    type: Date,
    required: [true, 'Wedding date is required']
  },
  endDate: Date,
  venue: {
    name: String,
    address: String,
    city: String
  },
  guestCount: {
    type: Number,
    default: 0
  },
  budget: {
    estimated: { type: Number, default: 0 },
    spent: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['planning', 'in_progress', 'completed', 'cancelled'],
    default: 'planning'
  },
  assignedTeam: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String
  }],
  relationshipManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vendors: [{
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    category: String,
    confirmed: { type: Boolean, default: false },
    amount: Number,
    notes: String
  }],
  notes: String,
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

weddingSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'wedding'
});

weddingSchema.index({ weddingDate: 1 });
weddingSchema.index({ status: 1 });

export default mongoose.model('Wedding', weddingSchema);
