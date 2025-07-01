import express from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createReviewSchema, updateReviewSchema, replyReviewSchema } from '../validations/review.validation.js';
import { handleReviewUpload } from '../middlewares/upload.middleware.js';
import Roles from '../constants/role.enum.js';
import { authMiddleware } from '../middlewares/index.js'

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Quản lý đánh giá sản phẩm
 */

// CLIENT
/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Tạo đánh giá mới (Client)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       201:
 *         description: Tạo đánh giá thành công
 *       400:
 *         description: Lỗi đầu vào
 */
router.post('/', authMiddleware.authenticateToken, handleReviewUpload, validate(createReviewSchema), reviewController.createReview);
/**
 * @swagger
 * /reviews/product/{productId}:
 *   get:
 *     summary: Lấy danh sách đánh giá của sản phẩm
 *     tags: [Reviews]
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/product/:productId', reviewController.getReviewsByProduct);
/**
 * @swagger
 * /reviews/my-reviews:
 *   get:
 *     summary: Lấy các đánh giá của chính người dùng
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */


router.get('/my-reviews',authMiddleware.authenticateToken, reviewController.getMyReviews);
/**
 * @swagger
 * /reviews/{reviewId}:
 *   put:
 *     summary: Cập nhật đánh giá
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:reviewId',authMiddleware.authenticateToken,  handleReviewUpload, validate(updateReviewSchema), reviewController.updateReview);
/**
 * @swagger
 * /reviews/{reviewId}:
 *   delete:
 *     summary: Xóa đánh giá của mình
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: reviewId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:reviewId', authMiddleware.authenticateToken, reviewController.deleteReview);
/**
 * @swagger
 * /reviews/{productId}/stats:
 *   get:
 *     summary: Thống kê đánh giá sản phẩm
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/:productId/stats',  authMiddleware.authenticateToken, reviewController.getProductStats);
// ADMIN
/**
 * @swagger
 * /reviews/admin/reviews:
 *   get:
 *     summary: "[Admin] Lấy danh sách tất cả đánh giá"
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/admin/reviews',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),   reviewController.getAllReviews);
/**
 * @swagger
 * /reviews/admin/reviews/{reviewId}/approve:
 *   put:
 *     summary: "[Admin] Duyệt đánh giá"
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: reviewId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Duyệt thành công
 */

router.put('/admin/reviews/:reviewId/approve',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), reviewController.approveReview);
/**
 * @swagger
 * /reviews/admin/reviews/{reviewId}/hide:
 *   put:
 *     summary: "[Admin] Ẩn hoặc hiện đánh giá"
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: reviewId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hidden:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái ẩn/hiện thành công
 */


router.put('/admin/reviews/:reviewId/hide',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),  reviewController.hideReview);
/**
 * @swagger
 * /reviews/admin/reviews/{reviewId}/reply:
 *   put:
 *     summary: "[Admin] Phản hồi đánh giá"
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: reviewId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *             properties:
 *               reply:
 *                 type: string
 *                 example: Cảm ơn bạn đã đánh giá!
 *     responses:
 *       200:
 *         description: Phản hồi thành công
 */
router.put('/admin/reviews/:reviewId/reply',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),validate(replyReviewSchema), reviewController.replyReview);
/**
 * @swagger
 * /reviews/admin/reviews/{reviewId}:
 *   delete:
 *     summary: "[Admin] Xóa đánh giá"
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: reviewId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

router.delete('/admin/reviews/:reviewId',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), reviewController.deleteReviewByAdmin);
/**
 * @swagger
 * /reviews/admin/reviews/dashboard:
 *   get:
 *     summary: "[Admin] Thống kê tổng quan về đánh giá"
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/admin/reviews/dashboard',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), reviewController.getReviewDashboard);
/**
 * @swagger
 * /reviews/{id}:
 *   get:
 *     summary: Lấy chi tiết đánh giá theo ID
 *     tags: [Reviews]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID của đánh giá
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy chi tiết đánh giá thành công
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
 *                   example: Get review detail successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 68633dbcad87e9c50746dd82
 *                     user_id:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 68308e47c9d3a2f04d3b7bda
 *                         name:
 *                           type: string
 *                           example: uyen
 *                         email:
 *                           type: string
 *                           example: nguyenvana@example.com
 *                     product_id:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 685bc96e027e91a1bd1d49a0
 *                         name:
 *                           type: string
 *                           example: Áo thun màu
 *                     rating:
 *                       type: integer
 *                       example: 4
 *                     comment:
 *                       type: string
 *                       example: sản phẩm như đẹp
 *                     approved:
 *                       type: boolean
 *                       example: true
 *                     hidden:
 *                       type: boolean
 *                       example: false
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - http://localhost:3000/uploads/reviews/review-1751334332596-0.jpg
 *                         - http://localhost:3000/uploads/reviews/review-1751334332598-1.jpg
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-07-01T01:45:32.763Z
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-07-01T01:45:32.764Z
 *                     __v:
 *                       type: integer
 *                       example: 0
 *       404:
 *         description: Không tìm thấy đánh giá
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Review not found
 *                 data:
 *                   type: string
 *                   example: null
 */

router.get('/:id', reviewController.getReviewDetail);
export default router;