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
      enum: ["cod", "banking", "zalopay", "momo"],
      required: true,
    },
    transactionId: {
      type: String,
    },
    paymentUrl: {
      type: String,
    },
    // ZaloPay specific fields
    appTransId: {
      type: String,
    },
    zpTransId: {
      type: String,
    },
    // MoMo specific fields
    requestId: {
      type: String,
    },
    momoTransId: {
      type: String,
    },
    // Gateway response data
    gatewayResponse: {
      type: Object,
      default: {},
    },
    paidAt: {
      type: Date,
    },
    note: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled", "refunded", "refund_requested"],
      default: "pending",
    },
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
