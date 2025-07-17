import mongoose from "mongoose";

const membershipTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },    
  min_spending: {
    type: Number,
    required: true,
    min: 0,
  },
  point_multiplier: {
    type: Number,
    required: true,
    default: 1.0,
  },
  benefits_text: {
    type: String,
    default: "",
  },
});

membershipTierSchema.index({ min_spending: 1 });

export default mongoose.model("MembershipTier", membershipTierSchema);
