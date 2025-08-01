import express from "express";
import { authController } from "../controllers/index.js";
import { authMiddleware } from "../middlewares/index.js";

const router = express.Router();

// ======= Routes public ====
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Các API liên quan đến đăng ký, đăng nhập và quản lý tài khoản
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng ký người dùng mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ hoặc lỗi khác
 */
router.post("/register", authController.register);
/**
 * @swagger
 * /auth/resend-verify-email:
 *   post:
 *     tags: [Authentication]
 *     summary: Gửi lại email xác thực cho người dùng chưa xác minh
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Gửi lại email xác thực thành công
 *       400:
 *         description: Email không tồn tại, đã xác thực, hoặc lỗi khác
 */
router.post("/resend-verify-email", authController.resendVerifyEmail);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng nhập người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Sai email hoặc mật khẩu
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Gửi email để đặt lại mật khẩu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordInput'
 *     responses:
 *       200:
 *         description: Email gửi thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Đặt lại mật khẩu bằng token
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token đặt lại mật khẩu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordInput'
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: Token không hợp lệ hoặc lỗi
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     tags: [Authentication]
 *     summary: Xác minh email người dùng
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token xác minh email
 *     responses:
 *       200:
 *         description: Xác minh email thành công
 *       400:
 *         description: Token không hợp lệ
 */
router.get("/verify-email", authController.verifyEmail);

// Routes (Authentication required)
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng xuất người dùng (yêu cầu access token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       400:
 *         description: Không tìm thấy token hoặc lỗi
 */
router.post("/logout", authMiddleware.authenticateToken, authController.logout);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Làm mới access token bằng refresh token trong cookie
 *     responses:
 *       200:
 *         description: Làm mới thành công
 *       400:
 *         description: Không có refresh token
 *       401:
 *         description: Refresh token không hợp lệ hoặc hết hạn
 */
// Refresh token route
router.post("/refresh-token", authController.refreshToken);

export default router;
