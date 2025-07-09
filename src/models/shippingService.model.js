import mongoose from "mongoose";

const shippingServiceSchema = new mongoose.Schema({
  carrier: String,
  service_id: Number,
  service_type_id: Number,
  short_name: String,
  description: String,
  active: Boolean,
});

export default mongoose.model("ShippingService", shippingServiceSchema);
