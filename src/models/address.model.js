import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
 province: {
    type: String,
    required: [true, 'Tỉnh/Thành phố là bắt buộc'],
    trim: true,
    maxLength: [100, 'Tên tỉnh/thành phố không được vượt quá 100 ký tự']
  },
  province_id: {
    type: Number,
    required: [true, 'Mã tỉnh/thành phố là bắt buộc']
  },
  district: {
    type: String,
    required: [true, 'Quận/Huyện là bắt buộc'],
    trim: true,
    maxLength: [100, 'Tên quận/huyện không được vượt quá 100 ký tự']
  },
  district_id: {
    type: Number,
    required: [true, 'Mã quận/huyện là bắt buộc']
  },
  ward: {
    type: String,
    required: [true, 'Phường/Xã là bắt buộc'],
    trim: true,
    maxLength: [100, 'Tên phường/xã không được vượt quá 100 ký tự']
  },
  ward_code: {
    type: String,
    required: [true, 'Mã phường/xã là bắt buộc']
  },
  phone: {
    type: String,
    maxLength: [20, 'Số điện thoại không được vượt quá 20 ký tự'],
    validate: {
      validator: function(v) {
        if (!v) return true; // phone is optional
        return /^[0-9+\-\s()]+$/.test(v);
      },
      message: 'Số điện thoại không hợp lệ'
    }
  },
  detail: {
    type: String,
    trim: true,
    maxLength: [500, 'Chi tiết địa chỉ không được vượt quá 500 ký tự']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    trim: true,
    maxLength: [50, 'Nhãn địa chỉ không được vượt quá 50 ký tự'],
    default: 'Nhà'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index để tối ưu query
addressSchema.index({ user: 1, isDefault: 1 });

// Middleware để đảm bảo chỉ có 1 địa chỉ mặc định cho mỗi user
addressSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Nếu đang set địa chỉ này làm mặc định, bỏ mặc định của các địa chỉ khác
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Middleware để đảm bảo luôn có ít nhất 1 địa chỉ mặc định
addressSchema.post('save', async function(doc) {
  const defaultCount = await this.constructor.countDocuments({
    user: doc.user,
    isDefault: true
  });
  
  if (defaultCount === 0) {
    // Nếu không có địa chỉ mặc định nào, set địa chỉ đầu tiên làm mặc định
    const firstAddress = await this.constructor.findOne({ user: doc.user }).sort({ created_at: 1 });
    if (firstAddress) {
      firstAddress.isDefault = true;
      await firstAddress.save();
    }
  }
});

// Virtual để format địa chỉ đầy đủ
addressSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.detail) parts.push(this.detail);
  parts.push(this.ward, this.district, this.province);
  return parts.join(', ');
});

// Đảm bảo virtual fields được include khi convert to JSON
addressSchema.set('toJSON', { virtuals: true });
addressSchema.set('toObject', { virtuals: true });

addressSchema.plugin(mongoosePaginate);

export default mongoose.model('Address', addressSchema);
