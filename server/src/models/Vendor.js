import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['catering', 'decor', 'photography', 'videography', 'music', 'makeup', 'venue', 'transport', 'invitation', 'other'],
    required: true
  },
  contactPerson: String,
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address']
  },
  phone: {
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
  address: String,
  city: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  priceRange: {
    type: String,
    enum: ['budget', 'moderate', 'premium', 'luxury'],
    default: 'moderate'
  },
  amount: {
    type: Number,
    default: 0
  },
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

vendorSchema.index({ category: 1 });
vendorSchema.index({ name: 'text' });

export default mongoose.model('Vendor', vendorSchema);
