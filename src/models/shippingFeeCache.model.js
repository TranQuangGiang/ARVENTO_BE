import mongoose from "mongoose";

const shippingFeeCacheSchema = new mongoose.Schema({
  from_district_id: Number,
  to_district_id: Number,
  to_ward_code: String,
  weight: Number,
  service_id: Number,
  fee: Number,
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model("ShippingFeeCache", shippingFeeCacheSchema);
