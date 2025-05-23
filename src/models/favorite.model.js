import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  versionKey: false
});

export default mongoose.model('Favorite', favoriteSchema);
