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
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false
  }
);

export default mongoose.model("Category", categorySchema);
