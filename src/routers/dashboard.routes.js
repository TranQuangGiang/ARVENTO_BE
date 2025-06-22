import express from "express";
import dashboardController from "../controllers/dashboard.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import Roles from "../constants/role.enum.js";

const router = express.Router();

/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     summary: Lấy tổng quan hệ thống
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tổng quan hệ thống
 */
router.get("/overview", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), dashboardController.getOverview);

/**
 * @swaggers
 * /dashboard/revenue:
 *   get:
 *     summary: Thống kê doanh thu
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Thống kê doanh thu
 */
router.get("/revenue", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), dashboardController.getRevenueStats);

/**
 * @swagger
 * /dashboard/orders/status:
 *   get:
 *     summary: Thống kê đơn hàng theo trạng thái
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê đơn hàng theo trạng thái
 */
router.get("/orders/status", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), dashboardController.getOrderStatusStats);

/**
 * @swagger
 * /dashboard/products/top-selling:
 *   get:
 *     summary: Sản phẩm bán chạy
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng sản phẩm trả về
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm bán chạy nhất
 */
router.get("/products/top-selling", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), dashboardController.getTopSellingProducts);

/**
 * @swagger
 * /dashboard/users/new:
 *   get:
 *     summary: Người dùng mới
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng user trả về
 *     responses:
 *       200:
 *         description: Danh sách user mới đăng ký gần đây
 */
router.get("/users/new", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), dashboardController.getNewUsers);

/**
 * @swagger
 * /dashboard/coupons/usage:
 *   get:
 *     summary: Thống kê số lần sử dụng từng mã giảm giá
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê số lần sử dụng từng mã giảm giá
 */
router.get("/coupons/usage", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), dashboardController.getCouponUsageStats);

export default router;
