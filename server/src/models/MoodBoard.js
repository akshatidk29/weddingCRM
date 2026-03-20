import mongoose from 'mongoose';

const moodBoardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'color'],
    required: [true, 'Item type is required']
  },
  mediaUrl: String,         // path for uploaded image/video
  colorHex: String,         // e.g. "#E8C4A0" for color swatches
  tags: [{ type: String, trim: true }],
  notes: String,
  weddingFunction: {
    type: String,
    enum: ['mehendi', 'sangeet', 'wedding', 'reception', 'haldi', 'engagement', 'cocktail', 'welcome_party', 'farewell', 'other'],
    default: 'other'
  },
  wedding: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wedding',
    required: [true, 'Wedding reference is required']
  },
  linkedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

moodBoardSchema.index({ wedding: 1, weddingFunction: 1 });
moodBoardSchema.index({ tags: 1 });
moodBoardSchema.index({ 'linkedEvents': 1 });

export default mongoose.model('MoodBoard', moodBoardSchema);
