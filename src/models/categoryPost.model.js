import mongoose from 'mongoose';

const categoryPostSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên danh mục là bắt buộc'],
    trim: true,
    maxLength: [100, 'Tên danh mục không vượt quá 100 ký tự'],
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});


// Tự động tạo slug từ name khi lưu
categoryPostSchema.pre('save', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD') // Chuẩn hóa Unicode
      .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
      .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự đặc biệt
      .replace(/\s+/g, '-') // Thay khoảng trắng bằng gạch ngang
      .trim();
  }
  next();
});

export default mongoose.model('CategoryPost', categoryPostSchema);