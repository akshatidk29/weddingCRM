import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: String,
  category: {
    type: String,
    enum: ['fnb', 'decor', 'logistics', 'av', 'photography', 'entertainment', 'attire', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'done', 'not_needed', 'verified'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  wedding: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wedding',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: Date,
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

taskSchema.index({ wedding: 1, category: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });

export default mongoose.model('Task', taskSchema);
