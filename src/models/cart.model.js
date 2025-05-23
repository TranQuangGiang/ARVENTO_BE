import mongoose from "mongoose";

const VariantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
}, { _id: false });

const CartItemSchema = new mongoose.Schema({
  product_id: { type: Number, required: true },
  selected_variant: { type: VariantSchema, required: true },
  quantity: { type: Number, required: true },
  saved_for_later: { type: Boolean, default: false },
  added_at: { type: Date, default: Date.now },
}, { _id: false });

const CartSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  items: [CartItemSchema],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Cart', CartSchema);
