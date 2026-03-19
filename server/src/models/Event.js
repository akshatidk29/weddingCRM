import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  description: String,
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  endDate: Date,
  venue: {
    name: String,
    address: String,
    city: String
  },
  wedding: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wedding',
    required: true
  },
  assignedTeam: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String
  }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  order: {
    type: Number,
    default: 0
  },
  notes: String,
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

eventSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'event'
});

eventSchema.index({ wedding: 1, eventDate: 1 });
eventSchema.index({ status: 1 });

export default mongoose.model('Event', eventSchema);
