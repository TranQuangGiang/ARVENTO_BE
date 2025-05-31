import express from 'express';
import { postController } from '../controllers/index.js';
import { uploadPostImages } from '../middlewares/upload.middleware.js';
import { authMiddleware } from '../middlewares/index.js'
import Roles from '../constants/role.enum.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Quản lý bài viết (công khai và admin)
 */
// PUBLIC ROUTES - Chỉ lấy published posts
/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Lấy tất cả bài viết đã được xuất bản
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Danh sách bài viết đã được xuất bản
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
router.get('/', postController.getAllPosts);
/**
 * @swagger
 * /posts/category/{categoryName}:
 *   get:
 *     summary: Lấy bài viết theo tên danh mục
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: categoryName
 *         schema:
 *           type: string
 *         required: true
 *         description: Tên danh mục
 *     responses:
 *       200:
 *         description: Danh sách bài viết trong danh mục
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
router.get('/category/:categoryName', postController.getPostsByCategoryName);
/**
 * @swagger
 * /posts/categories:
 *   get:
 *     summary: Lấy tất cả danh mục bài viết
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Danh sách danh mục bài viết
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/categories', postController.getCategories);
/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Lấy thông tin bài viết theo ID (đã xuất bản)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID bài viết
 *     responses:
 *       200:
 *         description: Chi tiết bài viết
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 */
router.get('/:id', postController.getPostById);



// ADMIN ROUTES - Có thể lấy tất cả posts
/**
 * @swagger
 * /posts/admin/all:
 *   get:
 *     summary: Admin - Lấy tất cả bài viết
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tất cả bài viết
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
router.get('/admin/all', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),postController.getAllPostsAdmin);
/**
 * @swagger
 * /posts/admin/{id}:
 *   get:
 *     summary: Admin - Lấy bài viết theo ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID bài viết
 *     responses:
 *       200:
 *         description: Chi tiết bài viết
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 */
router.get('/admin/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),postController.getPostByIdAdmin);
/**
 * @swagger
 * /posts/admin:
 *   post:
 *     summary: Admin - Tạo bài viết mới
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       201:
 *         description: Bài viết được tạo thành công
 */
router.post('/admin', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),uploadPostImages, postController.createPost);
/**
 * @swagger
 * /posts/admin/{id}:
 *   put:
 *     summary: Admin - Cập nhật bài viết
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID bài viết
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/admin/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),uploadPostImages, postController.updatePost);
/**
 * @swagger
 * /posts/admin/{id}:
 *   delete:
 *     summary: Admin - Xóa bài viết
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
 *         description: Xóa thành công
 */
router.delete('/admin/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),postController.deletePost);
/**
 * @swagger
 * /posts/admin/{id}/category:
 *   patch:
 *     summary: Admin - Cập nhật danh mục cho bài viết
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 example: "tin-tuc"
 *     responses:
 *       200:
 *         description: Cập nhật danh mục thành công
 */
router.patch('/admin/:id/category', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), postController.updatePostCategory);

export default router;
