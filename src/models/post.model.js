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
   category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryPost',
    required: [true, 'Danh mục bài viết là bắt buộc']
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

// Tự động set publishedAt khi status = published
postSchema.pre('save', function(next) {
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

postSchema.plugin(mongoosePaginate);

export default mongoose.model('Post', postSchema);