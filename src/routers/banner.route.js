import express from 'express';
import * as bannerController from '../controllers/banner.controller.js';
import { uploadBannerImage } from '../middlewares/upload.middleware.js';
import { authMiddleware } from '../middlewares/index.js'
import Roles from '../constants/role.enum.js';
// import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Banners
 *   description: API quản lý banner
 */
// Routes công khai
/**
 * @swagger
 * /banners:
 *   get:
 *     summary: Lấy tất cả banner đang active
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: Danh sách các banner active
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Banner'
 */
router.get('/', bannerController.getBanners); // Lấy tất cả banner đang active cho client
/**
 * @swagger
 * /banners/{id}:
 *   get:
 *     summary: Lấy chi tiết banner theo ID
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của banner
 *     responses:
 *       200:
 *         description: Thông tin chi tiết của banner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 */
router.get('/:id', bannerController.getBannerById); // Lấy chi tiết một banner theo ID
// Routes admin (yêu cầu xác thực và phân quyền)
// Lấy tất cả banner (cả active và inactive) cho admin
/**
 * @swagger
 * /banners/admin/all:
 *   get:
 *     summary: Admin - Lấy tất cả banner (active và inactive)
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách banner (bao gồm active và inactive)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Banner'
 */
router.get('/admin/all', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),bannerController.getAllBanners);

// Thêm banner mới
/**
 * @swagger
 * /banners/admin:
 *   post:
 *     summary: Admin - Thêm banner mới
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               link:
 *                 type: string
 *             required:
 *               - image
 *               - title
 *     responses:
 *       201:
 *         description: Banner được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 */
router.post(
  '/admin',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), 
  uploadBannerImage, 
  bannerController.createBanner
);

// Cập nhật banner
/**
 * @swagger
 * /banners/admin/{id}:
 *   put:
 *     summary: Admin - Cập nhật banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của banner cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               link:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật banner thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 */
router.put(
  '/admin/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), 
  uploadBannerImage, 
  bannerController.updateBanner
);

// Cập nhật trạng thái banner (bật/tắt)
/**
 * @swagger
 * /banners/admin/{id}/visibility:
 *   patch:
 *     summary: Admin - Cập nhật trạng thái hiển thị banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của banner cần cập nhật trạng thái
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *             required:
 *               - isActive
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 */
router.patch(
  '/admin/:id/visibility', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),
  bannerController.updateBannerStatus
);

// Cập nhật vị trí banner
/**
 * @swagger
 * /banners/admin/{id}/position:
 *   patch:
 *     summary: Admin - Cập nhật vị trí banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của banner cần cập nhật vị trí
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               position:
 *                 type: number
 *             required:
 *               - position
 *     responses:
 *       200:
 *         description: Cập nhật vị trí thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 */
router.patch(
  '/admin/:id/position', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), 
  bannerController.updateBannerPosition
);

// Xóa banner
/**
 * @swagger
 * /banners/admin/{id}:
 *   delete:
 *     summary: Admin - Xóa banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của banner cần xóa
 *     responses:
 *       200:
 *         description: Xóa banner thành công
 */
router.delete(
  '/admin/:id',  authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),
  bannerController.deleteBanner
);
export default router;
