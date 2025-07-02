import "dotenv/config";
import connectDB from "./src/config/db.config.js";
import app from "./src/app.js";
import paymentSyncJob from "./src/jobs/paymentSyncJob.js";

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
