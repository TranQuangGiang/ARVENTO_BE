import "dotenv/config";
import connectDB from "./src/config/db.config.js";
import app from "./src/app.js";
import paymentSyncJob from "./src/jobs/paymentSyncJob.js";
import "dotenv/config";
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    try {
      paymentSyncJob.start();
      console.log("Payment sync jobs started successfully");
    } catch (error) {
      console.error("Failed to start payment sync jobs:", error.message);
    }
  });
});
console.log("GHN_TOKEN:", process.env.GHN_TOKEN);
console.log("GHN_SHOP_ID:", process.env.GHN_SHOP_ID);
console.log("GHN_BASE_URL:", process.env.GHN_BASE_URL);
console.log("GHN_RETURN_DISTRICT_ID:", process.env.GHN_RETURN_DISTRICT_ID);
console.log("GHN_RETURN_ADDRESS:", process.env.GHN_RETURN_ADDRESS);
console.log("GHN_RETURN_PHONE:", process.env.GHN_RETURN_PHONE);