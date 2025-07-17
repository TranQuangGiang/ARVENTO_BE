import express from 'express';
import couponController from '../controllers/coupon.controller.js';
import {  createCouponValidation,
  updateCouponValidation,
  validateCouponValidation, paramsSchema, bodySchema, querySchema } from '../validations/coupon.validation.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authMiddleware } from '../middlewares/index.js';
import Roles from '../constants/role.enum.js';

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Quản lý mã giảm giá
 */
// ==================== ADMIN ROUTES ====================

// Tạo mã giảm giá mới (Admin only)
/**
 * @swagger
 * /coupons/admin/coupons:
 *   post:
 *     summary: Tạo mã giảm giá mới
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/couponModel'
 *     responses:
 *       201:
 *         description: Mã giảm giá được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/couponModel'
 */
router.post(
  '/admin/coupons',
  authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),
  validate({ body: createCouponValidation, query: querySchema }),
  couponController.createCoupon
);

// Lấy danh sách tất cả mã giảm giá (Admin only)
/**
 * @swagger
 * /coupons/admin/coupons:
 *   get:
 *     summary: Lấy danh sách mã giảm giá
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách mã giảm giá
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/couponModel'
 */
router.get(
  '/admin/coupons',
  couponController.getAllCoupons
);

// Lấy chi tiết 1 mã giảm giá (Admin only)
/**
 * @swagger
 * /coupons/admin/coupons/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một mã giảm giá
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của mã giảm giá
 *     responses:
 *       200:
 *         description: Thông tin mã giảm giá
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/couponModel'
 */

router.get(
  '/admin/coupons/:id',
  couponController.getCouponDetail
);

// Cập nhật mã giảm giá (Admin only)
/**
 * @swagger
 * /coupons/admin/coupons/{id}:
 *   patch:
 *     summary: Cập nhật mã giảm giá
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của mã giảm giá
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/couponModel'
 *     responses:
 *       200:
 *         description: Mã giảm giá đã được cập nhật
 */

router.patch(
  '/admin/coupons/:id',
  authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),
  validate({ params: paramsSchema, body: updateCouponValidation, query: querySchema }),
  couponController.updateCoupon
);

// Xóa mã giảm giá (Admin only)
/**
 * @swagger
 * /coupons/admin/coupons/{id}:
 *   delete:
 *     summary: Xóa mã giảm giá
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của mã giảm giá
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete(
  '/admin/coupons/:id',
  authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),
  couponController.deleteCoupon
);


// ==================== CLIENT ROUTES ====================
// Validate mã giảm giá (Client - yêu cầu xác thực và kiểm tra role)
/**
 * @swagger
 * /coupons/coupons/validate:
 *   post:
 *     summary: Kiểm tra tính hợp lệ của mã giảm giá
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SUMMER2024"
 *     responses:
 *       200:
 *         description: Kết quả kiểm tra mã giảm giá
 */
router.post(
  '/coupons/validate',
  authMiddleware.authenticateToken, authMiddleware.authorizeRoles(...Roles.ALL),
  validate({ body: validateCouponValidation, query: querySchema }),
  couponController.validateCoupon
);

// Áp dụng mã giảm giá (Client - yêu cầu xác thực)

/**
 * @swagger
 * /coupons/coupons/apply:
 *   post:
 *     summary: Áp dụng mã giảm giá
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SUMMER2024"
 *               total:
 *                 type: number
 *                 example: 500000
 *     responses:
 *       200:
 *         description: Thông tin sau khi áp dụng mã
 */

router.post(
  '/coupons/apply',
  couponController.applyCoupon
);

// Lấy lịch sử sử dụng mã (Admin,Client - yêu cầu xác thực)
/**
 * @swagger
 * /coupons/{id}/usage-history:
 *   get:
 *     summary: Lịch sử sử dụng mã giảm giá
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của mã giảm giá
 *     responses:
 *       200:
 *         description: Lịch sử sử dụng
 */
router.get(
  '/:id/usage-history',
  authMiddleware.authenticateToken,
  couponController.getUsageHistory
);
/**
 * @swagger
 * /coupons/admin/{id}/toggle:
 *   put:
 *     summary: Bật hoặc tắt trạng thái hoạt động của mã giảm giá
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của mã giảm giá cần bật/tắt
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cập nhật trạng thái mã giảm giá thành công"
 *                 data:
 *                   $ref: '#/components/schemas/couponModel'
 *       400:
 *         description: Yêu cầu không hợp lệ
 *       401:
 *         description: Không xác thực (chưa đăng nhập)
 *       403:
 *         description: Không có quyền (không phải admin)
 *       404:
 *         description: Không tìm thấy mã giảm giá
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/admin/:id/toggle',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), couponController.toggleCouponStatus);
/**
 * @swagger
 * /coupons/available:
 *   get:
 *     summary: Lấy danh sách mã giảm giá mà user hiện tại được sử dụng
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng bản ghi trên 1 trang
 *     responses:
 *       200:
 *         description: Danh sách coupon mà user hiện tại được sử dụng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Danh sách coupon user được sử dụng.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64a768c2fc13ae1b250001aa"
 *                       code:
 *                         type: string
 *                         example: "SUMMER2024"
 *                       discountType:
 *                         type: string
 *                         enum:
 *                           - percentage
 *                           - fixed_amount
 *                         example: "percentage"
 *                       discountValue:
 *                         type: number
 *                         example: 10
 *                       description:
 *                         type: string
 *                         example: "Giảm 10% cho đơn hàng từ 500k"
 *                       expiryDate:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-12-31T23:59:59.000Z"
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       500:
 *         description: Lỗi máy chủ
 */

router.get(
  "/available",authMiddleware.authenticateToken,
  couponController.getAvailableCouponsController
);

export default router;