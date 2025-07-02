import express from 'express';
import paymentSyncController from '../controllers/paymentSync.controller.js';
import { authMiddleware } from '../middlewares/index.js';
import Roles from '../constants/role.enum.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payment Sync
 *   description: API quản lý đồng bộ thanh toán
 */

/**
 * @swagger
 * /payment-sync/pending:
 *   post:
 *     summary: Đồng bộ thanh toán pending (Admin)
 *     tags: [Payment Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đồng bộ thành công
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
 *                     success:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                     unchanged:
 *                       type: integer
 */
router.post('/pending', 
  authMiddleware.authenticateToken, 
  authMiddleware.authorizeRoles(Roles.ADMIN), 
  paymentSyncController.syncPendingPayments
);

/**
 * @swagger
 * /payment-sync/payment/{paymentId}:
 *   post:
 *     summary: Đồng bộ một thanh toán cụ thể (Admin)
 *     tags: [Payment Sync]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thanh toán
 *     responses:
 *       200:
 *         description: Đồng bộ thành công
 *       404:
 *         description: Không tìm thấy thanh toán
 */
router.post('/payment/:paymentId', 
  authMiddleware.authenticateToken, 
  authMiddleware.authorizeRoles(Roles.ADMIN), 
  paymentSyncController.syncSinglePayment
);

/**
 * @swagger
 * /payment-sync/expired:
 *   post:
 *     summary: Xử lý thanh toán hết hạn (Admin)
 *     tags: [Payment Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xử lý thành công
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
 *                     expiredCount:
 *                       type: integer
 */
router.post('/expired', 
  authMiddleware.authenticateToken, 
  authMiddleware.authorizeRoles(Roles.ADMIN), 
  paymentSyncController.handleExpiredPayments
);

/**
 * @swagger
 * /payment-sync/reconcile:
 *   post:
 *     summary: Đối soát thanh toán theo khoảng thời gian (Admin)
 *     tags: [Payment Sync]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *       - in: query
 *         name: dateTo
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *     responses:
 *       200:
 *         description: Đối soát thành công
 *       400:
 *         description: Thiếu tham số dateFrom hoặc dateTo
 */
router.post('/reconcile', 
  authMiddleware.authenticateToken, 
  authMiddleware.authorizeRoles(Roles.ADMIN), 
  paymentSyncController.reconcilePayments
);

/**
 * @swagger
 * /payment-sync/jobs/status:
 *   get:
 *     summary: Lấy trạng thái sync jobs (Admin)
 *     tags: [Payment Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy trạng thái thành công
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
 *                     isRunning:
 *                       type: boolean
 *                     jobCount:
 *                       type: integer
 *                     jobs:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/jobs/status', 
  authMiddleware.authenticateToken, 
  authMiddleware.authorizeRoles(Roles.ADMIN), 
  paymentSyncController.getJobStatus
);

/**
 * @swagger
 * /payment-sync/jobs/start:
 *   post:
 *     summary: Khởi động sync jobs (Admin)
 *     tags: [Payment Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Khởi động thành công
 */
router.post('/jobs/start', 
  authMiddleware.authenticateToken, 
  authMiddleware.authorizeRoles(Roles.ADMIN), 
  paymentSyncController.startJobs
);

/**
 * @swagger
 * /payment-sync/jobs/stop:
 *   post:
 *     summary: Dừng sync jobs (Admin)
 *     tags: [Payment Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dừng thành công
 */
router.post('/jobs/stop', 
  authMiddleware.authenticateToken, 
  authMiddleware.authorizeRoles(Roles.ADMIN), 
  paymentSyncController.stopJobs
);

/**
 * @swagger
 * /payment-sync/jobs/trigger/{jobName}:
 *   post:
 *     summary: Thực thi job cụ thể (Admin)
 *     tags: [Payment Sync]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [syncPending, handleExpired, dailyReconciliation, healthCheck]
 *         description: Tên job cần thực thi
 *     responses:
 *       200:
 *         description: Thực thi thành công
 *       400:
 *         description: Tên job không hợp lệ
 */
router.post('/jobs/trigger/:jobName', 
  authMiddleware.authenticateToken, 
  authMiddleware.authorizeRoles(Roles.ADMIN), 
  paymentSyncController.triggerJob
);

/**
 * @swagger
 * /payment-sync/statistics:
 *   get:
 *     summary: Lấy thống kê đồng bộ thanh toán (Admin)
 *     tags: [Payment Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 */
router.get('/statistics', 
  authMiddleware.authenticateToken, 
  authMiddleware.authorizeRoles(Roles.ADMIN), 
  paymentSyncController.getStatistics
);

/**
 * @swagger
 * /payment-sync/health:
 *   get:
 *     summary: Kiểm tra sức khỏe hệ thống thanh toán (Admin)
 *     tags: [Payment Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kiểm tra thành công
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
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     stuckPayments:
 *                       type: integer
 *                     failedPayments:
 *                       type: integer
 *                     successfulPayments:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [healthy, warning]
 */
router.get('/health', 
  authMiddleware.authenticateToken, 
  authMiddleware.authorizeRoles(Roles.ADMIN), 
  paymentSyncController.getHealthCheck
);

/**
 * @swagger
 * /payment-sync/dashboard:
 *   get:
 *     summary: Lấy dữ liệu dashboard đồng bộ thanh toán (Admin)
 *     tags: [Payment Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy dashboard thành công
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
 *                     jobStatus:
 *                       type: object
 *                     statistics:
 *                       type: object
 *                     health:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get('/dashboard', 
  authMiddleware.authenticateToken, 
  authMiddleware.authorizeRoles(Roles.ADMIN), 
  paymentSyncController.getDashboard
);

export default router;
