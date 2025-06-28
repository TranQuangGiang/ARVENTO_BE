import express from "express";
import orderController from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/index.js";
import Roles from "../constants/role.enum.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Order
 *   description: API quản lý đơn hàng
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Tạo đơn hàng mới
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items: { type: array, items: { type: object } }
 *               total: { type: number }
 *               address: { type: object }
 *               note: { type: string }
 *     responses:
 *       201: { description: Tạo đơn hàng thành công }
 */
router.post("/", authMiddleware.authenticateToken, orderController.createOrder);

/**
 * @swagger
 * /orders/stats:
 *   get:
 *     summary: Thống kê tổng quan đơn hàng (admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lấy thống kê thành công }
 */
router.get("/stats", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), orderController.getOrderStats);

/**
 * @swagger
 * /orders/revenue:
 *   get:
 *     summary: Doanh thu theo ngày/tháng (admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [day, month] }
 *     responses:
 *       200: { description: Lấy doanh thu thành công }
 */
router.get("/revenue", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), orderController.getRevenueByDate);

/**
 * @swagger
 * /orders/recent:
 *   get:
 *     summary: Đơn hàng mới nhất (admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Lấy đơn hàng mới nhất thành công }
 */
router.get("/recent", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), orderController.getRecentOrders);

/**
 * @swagger
 * /orders/export:
 *   get:
 *     summary: Xuất đơn hàng ra file (admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Xuất file thành công }
 */
router.get("/export", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), orderController.exportOrders);

/**
 * @swagger
 * /orders/my:
 *   get:
 *     summary: Lấy danh sách đơn hàng của tôi
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lấy danh sách đơn hàng thành công }
 */
router.get("/my", authMiddleware.authenticateToken, orderController.getMyOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lấy chi tiết đơn hàng thành công }
 *       404: { description: Không tìm thấy đơn hàng }
 */
router.get("/:id", authMiddleware.authenticateToken, orderController.getOrderDetail);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Hủy đơn hàng của tôi
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Hủy đơn hàng thành công }
 *       403: { description: Không có quyền }
 *       404: { description: Không tìm thấy đơn hàng }
 */
router.patch("/:id/cancel", authMiddleware.authenticateToken, orderController.cancelOrder);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Lấy tất cả đơn hàng (admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: user
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Lấy danh sách đơn hàng thành công }
 */

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái đơn hàng (admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string }
 *     responses:
 *       200: { description: Cập nhật trạng thái thành công }
 *       403: { description: Không có quyền }
 *       404: { description: Không tìm thấy đơn hàng }
 */
router.patch("/:id/status", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), orderController.updateOrderStatus);

/**
 * @swagger
 * /orders/{id}/timeline:
 *   get:
 *     summary: Lấy lịch sử trạng thái đơn hàng
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lấy timeline thành công }
 *       404: { description: Không tìm thấy đơn hàng }
 */
router.get("/:id/timeline", authMiddleware.authenticateToken, orderController.getOrderTimeline);

// Admin route - phải đặt cuối cùng để tránh conflict với các routes khác
router.get("/", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), orderController.getAllOrders);

export default router;
