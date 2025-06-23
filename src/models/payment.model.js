import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ["cod", "banking"],
      required: true,
    },
    transactionId: {
      type: String,
    },
    paymentUrl: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    note: {
      type: String,
    },
    status: { type: String, enum: ["pending", "completed", "failed", "refunded", "refund_requested"], default: "pending" },
    timeline: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: Date,
        note: String,
      },
    ],
    refund: {
      requested: { type: Boolean, default: false },
      reason: String,
      requestedAt: Date,
      processedAt: Date,
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Payment", paymentSchema);
