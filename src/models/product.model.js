import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const variantSchema = new mongoose.Schema({
  size: {
    type: String,
    maxLength: 10
  },
  color: {
    type: String,
    maxLength: 50
  },
  stock: {
    type: Number
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Category' 
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
  price: {
    type: mongoose.Types.Decimal128,
    required: true
  },
  stock: {
    type: Number,
    required: true
  },
  images: {
    type: [String]
  },
  variants: {
    type: [variantSchema]
  },
  tags: {
    type: [String]
  }
}, {   
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

productSchema.plugin(mongoosePaginate);

export const productModel = mongoose.model('Product', productSchema);
