import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  image_url: {
    type: String,
    required: true,
    maxLength: 255
  },
  title: {
    type: String,
    maxLength: 255
  },
  link: {
    type: String,
    maxLength: 255
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  versionKey: false
});

export default mongoose.model('Banner', bannerSchema);
