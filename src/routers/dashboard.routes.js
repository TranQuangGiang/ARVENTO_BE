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
 *         description: "Lấy thành công"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userCount:
 *                       type: integer
 *                     orderCount:
 *                       type: integer
 *                     productCount:
 *                       type: integer
 *                     couponCount:
 *                       type: integer
 */
router.get("/overview", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), dashboardController.getOverview);

/**
 * @swagger
 * /dashboard/revenue:
 *   get:
 *     summary: Thống kê doanh thu theo ngày
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: "Ngày bắt đầu (YYYY-MM-DD)"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: "Ngày kết thúc (YYYY-MM-DD)"
 *     responses:
 *       200:
 *         description: "Dữ liệu doanh thu theo thời gian"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         example: "2025-07-25"
 *                       revenue:
 *                         type: number
 *                         example: 5000000
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
 *         description: "Thống kê đơn hàng theo trạng thái"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                         example: "delivered"
 *                       count:
 *                         type: integer
 *                         example: 32
 */
router.get("/orders/status", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), dashboardController.getOrderStatusStats);

/**
 * @swagger
 * /dashboard/best-sellers:
 *   get:
 *     summary: Danh sách sản phẩm bán chạy nhất
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: "Số lượng sản phẩm trả về (mặc định: 10)"
 *     responses:
 *       200:
 *         description: "Danh sách sản phẩm bán chạy nhất"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productName:
 *                         type: string
 *                       quantitySold:
 *                         type: integer
 *                       totalRevenue:
 *                         type: number
 */
router.get("/best-sellers", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), dashboardController.getTopSellingProducts);

/**
 * @swagger
 * /dashboard/users-new:
 *   get:
 *     summary: Số lượng người dùng mới đăng ký
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: "Ngày bắt đầu (YYYY-MM-DD)"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: "Ngày kết thúc (YYYY-MM-DD)"
 *     responses:
 *       200:
 *         description: "Số lượng người dùng mới"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalNewUsers:
 *                       type: integer
 *                       example: 120
 */
router.get("/users-new", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), dashboardController.getNewUsers);

/**
 * @swagger
 * /dashboard/coupons/top-discount-used:
 *   get:
 *     summary: Danh sách mã giảm giá được sử dụng nhiều nhất
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Danh sách mã giảm giá"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: "SUMMER50"
 *                       usedCount:
 *                         type: integer
 *                         example: 128
 */
router.get("/coupons/top-discount-used", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), dashboardController.getTopDiscountUsed);

/**
 * @swagger
 * /dashboard/stock-warning:
 *   get:
 *     summary: Danh sách sản phẩm sắp hết hàng
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Danh sách sản phẩm sắp hết"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productName:
 *                         type: string
 *                       quantityRemaining:
 *                         type: integer
 *                       threshold:
 *                         type: integer
 */
router.get("/stock-warning", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), dashboardController.getLowStockProducts);

export default router;
