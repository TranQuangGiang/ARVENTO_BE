import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxLength: 100
    },
    slug: {
      type: String,
      required: true,
      maxLength: 100
    },
    description: { // Thêm trường description
      type: String,
      required: false // Trường này là tùy chọn
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }, // Giữ nguyên createdAt và tắt updatedAt
    versionKey: false // Tắt trường __v
  }
);

export default mongoose.model("Category", categorySchema);
