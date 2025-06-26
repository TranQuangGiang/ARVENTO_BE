import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  approved: {
    type: Boolean,
    default: false
  },
  hidden: {
    type: Boolean,
    default: false
  },
  reply: {
    type: String,
    trim: true
  },
  images: {
  type: [String],
  default: []
},
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date
  }
});

reviewSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model('Review', reviewSchema);
