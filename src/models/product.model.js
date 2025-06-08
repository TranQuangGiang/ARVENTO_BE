import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

import { generateSlug } from '../utils/index.js';

const variantSchema = new mongoose.Schema({
  size: {
    type: String,
    maxLength: 10
  },
  color: {
    type: String,
    maxLength: 50
  },
  image: {
    type: String
  },
  stock: {
    type: Number,
    min: 0
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Category'
  },
  product_code: {
    type: String,
    required: true,
    maxLength: 50,
    unique: true
  },
  name: {
    type: String,
    required: true,
    maxLength: 150
  },
  slug: {
    type: String,
    required: true,
    maxLength: 150
  },
  description: {
    type: String
  },
  original_price: {
    type: mongoose.Types.Decimal128,
    required: true
  },
  sale_price: {
    type: mongoose.Types.Decimal128
  },
  images: {
    type: [String],
    validate: [array => array.length <= 5, 'Không được upload quá 5 ảnh cho sản phẩm']
  },
  variants: {
    type: [variantSchema],
    validate: [array => array.length <= 10, 'Không được thêm quá 10 biến thể cho sản phẩm']
  },
  tags: {
    type: [String]
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});
productSchema.plugin(mongoosePaginate);

productSchema.pre('validate', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = generateSlug(this.name);
  }
  next();
});


export default  mongoose.model('Product', productSchema);

