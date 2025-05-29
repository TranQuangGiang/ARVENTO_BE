import express from "express";
import { authController } from "../controllers/index.js";
import { authMiddleware } from "../middlewares/index.js";

const router = express.Router();

// Routes public
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/verify-email", authController.verifyEmail);

// Routes (Authentication required)
router.post("/logout", authMiddleware.authenticateToken, authController.logout);

// Refresh token route
router.post("/refresh-token", authController.refreshToken);

export default router;
