import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const addressSchema = new mongoose.Schema({
  ward: { type: String, required: true },
  district: { type: String, required: true },
  province: { type: String, required: true },
  phone: { type: String, maxLength: 20 },
  detail: { type: String },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxLength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxLength: 100
  },
  password: {
    type: String,
    required: true,
    maxLength: 255
  },
  phone: {
    type: String,
    maxLength: 20
  },
  address: {
    type: [addressSchema],
    default: []
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'admin'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

userSchema.plugin(mongoosePaginate);

export default mongoose.model('User', userSchema);
