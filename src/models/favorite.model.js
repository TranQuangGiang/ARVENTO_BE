import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false, // tắt __v
  }
);

// ✅ Đảm bảo 1 user chỉ thích 1 sản phẩm 1 lần
favoriteSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

const favoriteModel = mongoose.model('Favorite', favoriteSchema);

export default favoriteModel;
