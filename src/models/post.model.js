import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 255
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    trim: true,
    maxLength: 500
  },
  thumbnail: {
    type: String,
    default: null
  },
  album: [{
    type: String
  }],
  // Thêm cả category (slug) và category_name (display name)
  category: {
    type: String,
    trim: true,
    maxLength: 100,
    lowercase: true // Để làm slug/key
  },
  category_name: {
    type: String,
    trim: true,
    maxLength: 100 // Tên hiển thị cho user
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: 50
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index cho tìm kiếm
postSchema.index({ category: 1 });
postSchema.index({ status: 1 });
postSchema.index({ publishedAt: -1 });
postSchema.index({ category: 1, status: 1 });

// Pre-save middleware để tự động tạo category slug từ category_name
postSchema.pre('save', function(next) {
  // Tự động tạo category slug từ category_name
  if (this.category_name && !this.category) {
    this.category = this.category_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự đặc biệt
      .replace(/\s+/g, '-') // Thay space bằng -
      .trim();
  }
  
  // Tự động set publishedAt khi status = published
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

postSchema.plugin(mongoosePaginate);

export default mongoose.model('Post', postSchema);
