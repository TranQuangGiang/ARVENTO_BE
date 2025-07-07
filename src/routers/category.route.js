    import express from 'express';
    import categoryController from '../controllers/category.controller.js';
    import { authMiddleware } from '../middlewares/index.js';
    import Roles from '../constants/role.enum.js';
import uploadMiddlewares from '../middlewares/upload.middleware.js';
    const router = express.Router();
    /**
     * @swagger
     * tags:
     *   name: Categories
     *   description: API quản lý danh mục sản phẩm

    * components:
    *   securitySchemes:
    *     bearerAuth:
    *       type: http
    *       scheme: bearer
    *       bearerFormat: JWT
    */
    // --- Client Routes ---
    /**
     * @swagger
     * /categories/client:
     *   get:
     *     summary: Lấy danh sách danh mục cho client
     *     tags: [Categories]
     *     responses:
     *       200:
     *         description: Thành công 
     */
    router.get('/client', categoryController.getAllCategoriesForClient);
    /**
     * @swagger
     * /categories/client/{slug}:
     *   get:
     *     summary: Lấy chi tiết danh mục theo slug
     *     tags: [Categories]
     *     parameters:
     *       - in: path
     *         name: slug
     *         schema:
     *           type: string
     *         required: true
     *         description: Slug của danh mục
     *     responses:
     *       200:
     *         description: Thành công
     */
    router.get('/client/:slug', categoryController.getCategoryDetailForClient);

    // --- Admin Routes ---
    /**
     * @swagger
     * /categories/admin:
     *   get:
     *     summary: Lấy tất cả danh mục (ADMIN)
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Thành công
     */
    router.get('/admin', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), categoryController.getAllCategoriesForAdmin);
    /**
     * @swagger
     * /categories/admin/{id}:
     *   get:
     *     summary: Lấy chi tiết danh mục theo ID (ADMIN)
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         description: ID danh mục
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Thành công
     */
    router.get('/admin/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), categoryController.getCategoryByIdForAdmin);
    /**
     * @swagger
     *  /categories/admin:
     *   post:
     *     summary: Tạo mới danh mục (ADMIN)
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/categoryModel'
     *     responses:
     *       201:
     *         description: Tạo thành công
     */
    router.post('/admin', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), uploadMiddlewares.uploadCategoryImage,categoryController.createCategory);
    /**
     * @swagger
     * /categories/admin/{id}:
     *  put:
     *     summary: Cập nhật danh mục theo ID (ADMIN)
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         description: ID danh mục
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/categoryModel'
     *     responses:
     *       200:
     *         description: Cập nhật thành công
     */
    router.put('/admin/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), uploadMiddlewares.uploadCategoryImage,categoryController.updateCategory);
    /**
     * @swagger
     * /categories/admin/{id}:
     *  delete:
     *     summary: Xóa danh mục theo ID (ADMIN)
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         description: ID danh mục
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Xóa thành công
     */
    router.delete('/admin/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), categoryController.deleteCategory);

    export default router;