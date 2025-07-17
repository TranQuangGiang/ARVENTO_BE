import mongoose from "mongoose";

const rewardPointSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    type: {
      type: String,
      enum: ["earn", "redeem", "adjustment"],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    expired_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

rewardPointSchema.index({ user: 1, created_at: -1 });

export default mongoose.model("RewardPoint", rewardPointSchema);
