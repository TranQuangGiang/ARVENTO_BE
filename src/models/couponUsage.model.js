import mongoose from 'mongoose';
const { Schema } = mongoose;

const couponUsageSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coupon: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Số lần sử dụng không hợp lệ'],
    },
  },
  {
    timestamps: true,
  }
);

// Mỗi user chỉ có 1 bản ghi usage cho 1 coupon
couponUsageSchema.index({ user: 1, coupon: 1 }, { unique: true });


export default mongoose.model('CouponUsage', couponUsageSchema);