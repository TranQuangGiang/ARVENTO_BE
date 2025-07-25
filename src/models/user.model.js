import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxLength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      maxLength: 100,
    },
    password: {
      type: String,
      required: true,
      maxLength: 255,
    },
    phone: {
      type: String,
      maxLength: 20,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "admin",
    },
    current_tier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipTier",
      default: null,
    },
    total_spending: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Virtual populate để lấy addresses của user
userSchema.virtual("addresses", {
  ref: "Address",
  localField: "_id",
  foreignField: "user",
});

// Đảm bảo virtual fields được include khi convert to JSON
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

userSchema.plugin(mongoosePaginate);

export default mongoose.model("User", userSchema);
