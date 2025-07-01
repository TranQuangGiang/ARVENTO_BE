import express from "express";
import paymentController from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/index.js";
import webhookMiddleware from "../middlewares/webhook.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: API quản lý thanh toán
 */

/**
 * @swagger
 * /payments/cod:
 *   post:
 *     summary: Tạo thanh toán khi nhận hàng (COD)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order: { type: string }
 *               amount: { type: number }
 *               note: { type: string }
 *     responses:
 *       201: { description: Tạo thanh toán COD thành công }
 */
router.post("/cod", authMiddleware.authenticateToken, paymentController.createCODPayment);

/**
 * @swagger
 * /payments/banking:
 *   post:
 *     summary: Tạo thanh toán online (banking)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order: { type: string }
 *               amount: { type: number }
 *               note: { type: string }
 *     responses:
 *       201: { description: Tạo thanh toán banking thành công }
 */
router.post("/banking", authMiddleware.authenticateToken, paymentController.createBankingPayment);

/**
 * @swagger
 * /payments/banking/callback:
 *   post:
 *     summary: Callback xác nhận thanh toán banking thành công
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId: { type: string }
 *     responses:
 *       200: { description: Xác nhận thanh toán banking thành công }
 */
router.post("/banking/callback", paymentController.confirmBankingPayment);

/**
 * @swagger
 * /payments/zalopay:
 *   post:
 *     summary: Tạo thanh toán ZaloPay
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order: { type: string }
 *               amount: { type: number }
 *               note: { type: string }
 *     responses:
 *       201: { description: Tạo thanh toán ZaloPay thành công }
 */
router.post("/zalopay", authMiddleware.authenticateToken, paymentController.createZaloPayPayment);

/**
 * @swagger
 * /payments/zalopay/callback:
 *   post:
 *     summary: Callback xác nhận thanh toán ZaloPay
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Xác nhận thanh toán ZaloPay thành công }
 */
router.post("/zalopay/callback", webhookMiddleware.logWebhookRequest, webhookMiddleware.validateWebhookPayload(["data", "mac"]), paymentController.confirmZaloPayPayment);

/**
 * @swagger
 * /payments/zalopay/{id}/status:
 *   get:
 *     summary: Truy vấn trạng thái thanh toán ZaloPay
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Truy vấn trạng thái thành công }
 */
router.get("/zalopay/:id/status", authMiddleware.authenticateToken, paymentController.queryZaloPayStatus);

/**
 * @swagger
 * /payments/momo:
 *   post:
 *     summary: Tạo thanh toán MoMo
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order: { type: string }
 *               amount: { type: number }
 *               note: { type: string }
 *     responses:
 *       201: { description: Tạo thanh toán MoMo thành công }
 */
router.post("/momo", authMiddleware.authenticateToken, paymentController.createMoMoPayment);

/**
 * @swagger
 * /payments/momo/callback:
 *   post:
 *     summary: Callback xác nhận thanh toán MoMo
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Xác nhận thanh toán MoMo thành công }
 */
router.post("/momo/callback", webhookMiddleware.logWebhookRequest, webhookMiddleware.validateWebhookPayload(["orderId", "resultCode", "signature"]), paymentController.confirmMoMoPayment);

/**
 * @swagger
 * /payments/momo/{id}/status:
 *   get:
 *     summary: Truy vấn trạng thái thanh toán MoMo
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Truy vấn trạng thái thành công }
 */
router.get("/momo/:id/status", authMiddleware.authenticateToken, paymentController.queryMoMoStatus);
/**
 * @swagger
 * /payments/my:
 *   get:
 *     summary: Lấy danh sách thanh toán của tôi
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lấy danh sách thanh toán thành công }
 */

router.get("/my", authMiddleware.authenticateToken, paymentController.getMyPayments);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Lấy chi tiết thanh toán
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lấy chi tiết thanh toán thành công }
 *       404: { description: Không tìm thấy thanh toán }
 */
router.get("/:id", authMiddleware.authenticateToken, paymentController.getPaymentDetail);

/**
 * @swagger
 * /payments/refund:
 *   post:
 *     summary: Yêu cầu hoàn tiền thanh toán (user)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId: { type: string }
 *               reason: { type: string }
 *     responses:
 *       200: { description: Gửi yêu cầu hoàn tiền thành công }
 */
router.post("/refund", authMiddleware.authenticateToken, paymentController.requestRefund);

/**
 * @swagger
 * /payments/{id}/history:
 *   get:
 *     summary: Lấy lịch sử trạng thái thanh toán (user)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lấy lịch sử trạng thái thành công }
 */
router.get("/:id/history", authMiddleware.authenticateToken, paymentController.getPaymentHistory);

export default router;
