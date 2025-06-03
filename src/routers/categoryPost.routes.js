// src/routes/categoryPost.routes.js
import express from 'express';
import categoryPostController from '../controllers/categoryPost.controller.js';
import Roles from '../constants/role.enum.js';
import { authMiddleware } from '../middlewares/index.js'
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: CategoryPosts
 *   description: Quản lý danh mục bài viết
 */
// --- Client Routes ---
/**
 * @swagger
 * /categoryPost/client:
 *   get:
 *     summary: Lấy tất cả danh mục bài viết cho client
 *     tags: [CategoryPosts]
 *     responses:
 *       200:
 *         description: Danh sách danh mục bài viết
 */
router.get('/client', categoryPostController.getAllCategoriesClient);

// --- Admin Routes 
/**
 * @swagger
 * /categoryPost/admin:
 *   get:
 *     summary: Lấy tất cả danh mục bài viết cho admin
 *     tags: [CategoryPosts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách danh mục bài viết (admin)
 */
router.get('/admin',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), categoryPostController.getAllCategoriesAdmin);
/**
 * @swagger
 * /categoryPost/admin/{id}:
 *   get:
 *     summary: Lấy danh mục bài viết theo ID (admin)
 *     tags: [CategoryPosts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID danh mục bài viết
 *     responses:
 *       200:
 *         description: Chi tiết danh mục bài viết
 */
router.get('/admin/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),categoryPostController.getCategoryByIdAdmin);

/**
 * @swagger
 * /categoryPost/admin:
 *   post:
 *     summary: Tạo danh mục bài viết mới
 *     tags: [CategoryPosts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/categoryPostModel'
 *     responses:
 *       201:
 *         description: Danh mục bài viết đã được tạo
 */
router.post('/admin', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),categoryPostController.createCategory);
/**
 * @swagger
 * /categoryPost/admin/{id}:
 *   put:
 *     summary: Cập nhật danh mục bài viết
 *     tags: [CategoryPosts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID danh mục bài viết
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/categoryPostModel'
 *     responses:
 *       200:
 *         description: Danh mục đã được cập nhật
 */
router.put('/admin/:id',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), categoryPostController.updateCategory);
/**
 * @swagger
 * /categoryPost/admin/{id}:
 *   delete:
 *     summary: Xoá danh mục bài viết
 *     tags: [CategoryPosts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID danh mục bài viết
 *     responses:
 *       200:
 *         description: Danh mục đã được xoá
 */
router.delete('/admin/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),categoryPostController.deleteCategory);

export default router;