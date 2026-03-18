import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['task_assigned', 'task_due', 'lead_assigned', 'wedding_update', 'general'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: String,
  link: String,
  read: {
    type: Boolean,
    default: false
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['Lead', 'Wedding', 'Task', 'Vendor']
    },
    id: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
