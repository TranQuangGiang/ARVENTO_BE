import express from 'express';
import { authMiddleware } from '../middlewares/index.js'
import { userController } from '../controllers/index.js'
import Roles from '../constants/role.enum.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Người dùng
 *   description: API quản lý người dùng
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng (Chỉ Admin)
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tất cả người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Chưa xác thực (Unauthorized)
 *       403:
 *         description: Không có quyền truy cập (Forbidden)
 */
router.get('/', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), userController.getAllUsers);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Chưa xác thực
 */
router.get('/me', authMiddleware.authenticateToken, userController.getMe);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Cập nhật thông tin người dùng hiện tại
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Thông tin người dùng đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Chưa xác thực
 */
router.put('/me', authMiddleware.authenticateToken, userController.updateMe);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Lấy thông tin người dùng theo ID
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID người dùng
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.get('/:id', authMiddleware.authenticateToken, userController.getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng theo ID
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Thông tin người dùng đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.put('/:id', authMiddleware.authenticateToken, userController.updateUser);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Tạo người dùng mới (Chỉ Admin)
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Người dùng đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.post('/', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), userController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Xóa người dùng theo ID (Chỉ Admin)
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID người dùng
 *     responses:
 *       204:
 *         description: Người dùng đã bị xóa
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.delete('/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), userController.deleteUser);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Thay đổi vai trò người dùng (Chỉ Admin)
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 example: admin
 *     responses:
 *       200:
 *         description: Đã cập nhật vai trò người dùng
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.patch('/:id/role', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), userController.changeUserRole);

export default router;
