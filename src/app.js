import express from "express";
import cors from "cors";
import path from "path";
import routes from "./routers/index.js";
import {
  swagger,
  corsConfig,
  //  apiLimiter
} from "./config/index.js";
import { fileURLToPath } from "url";

// Nếu bạn dùng ESModule, cần lấy __dirname như sau:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors(corsConfig.corsOptions));
// app.use(apiLimiter);
// (async () => {
//   try {
//     await redisClient.connect();
//     console.log('Connected to Redis');
//   } catch (err) {
//     console.error('Redis connection error:', err);
//   }
// })();
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));
app.use("/api-docs", swagger.swaggerUi.serve, swagger.swaggerUi.setup(swagger.swaggerSpec));
app.use("/api", routes);

export default app;
