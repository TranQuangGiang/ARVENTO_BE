// src/routes/post.routes.js
import express from 'express';
import postController from '../controllers/post.controller.js';
import { uploadPostImages } from '../middlewares/upload.middleware.js';
import Roles from '../constants/role.enum.js';
import { authMiddleware } from '../middlewares/index.js'

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Quản lý bài viết
 */

// --- Client Routes ---
/**
 * @swagger
 * /posts/client:
 *   get:
 *     summary: Lấy tất cả bài viết (Client)
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Danh sách bài viết
 */
router.get('/client', postController.getAllPostsClient);
/**
 * @swagger
 * /posts/client/category/{slug}:
 *   get:
 *     summary: Lấy bài viết theo slug danh mục (Client)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug của danh mục
 *     responses:
 *       200:
 *         description: Danh sách bài viết theo danh mục
 */
router.get('/client/category/:slug', postController.getPostsByCategorySlugClient);

/**
 * @swagger
 * /posts/client/{slug}:
 *   get:
 *     summary: Lấy chi tiết bài viết theo slug (Client)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug của bài viết
 *     responses:
 *       200:
 *         description: Thông tin chi tiết bài viết
 */
router.get('/client/:slug', postController.getPostBySlugClient);

// --- Admin Routes ----
/**
 * @swagger
 * /posts/admin:
 *   get:
 *     summary: Lấy tất cả bài viết (Admin)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách bài viết cho admin
 */
router.get('/admin',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), postController.getAllPostsAdmin);
/**
 * @swagger
 * /posts/admin/{id}:
 *   get:
 *     summary: Lấy chi tiết bài viết theo ID (Admin)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của bài viết
 *     responses:
 *       200:
 *         description: Chi tiết bài viết
 */
router.get('/admin/:id',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), postController.getPostByIdAdmin);
/**
 * @swagger
 * /posts/admin:
 *   post:
 *     summary: Tạo mới bài viết (Admin)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               content:
 *                 type: string
 *               category_id:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Tạo bài viết thành công
 */
router.post('/admin', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),uploadPostImages, postController.createPost);
/**
 * @swagger
 * /posts/admin/{id}:
 *   put:
 *     summary: Cập nhật bài viết (Admin)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bài viết
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               content:
 *                 type: string
 *               category_id:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Cập nhật bài viết thành công
 */
router.put('/admin/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),uploadPostImages, postController.updatePost); 
/**
 * @swagger
 * /posts/admin/{id}:
 *   delete:
 *     summary: Xoá bài viết (Admin)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bài viết
 *     responses:
 *       200:
 *         description: Xoá bài viết thành công
 */
router.delete('/admin/:id',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), postController.deletePost);

export default router;