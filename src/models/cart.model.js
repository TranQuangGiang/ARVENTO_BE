// models/cart.model.js
import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variant',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: mongoose.Types.Decimal128,
    required: true
  },
  total_price: {
    type: mongoose.Types.Decimal128,
    required: true
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Mỗi user chỉ có 1 cart
  },
  items: {
    type: [cartItemSchema],
    default: []
  },
  total_quantity: {
    type: Number,
    default: 0
  },
  total_price: {
    type: mongoose.Types.Decimal128,
    default: 0.0
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

const cartModel = mongoose.model('Cart', cartSchema);
export default cartModel;
