import express from 'express';
import optionController from '../controllers/option.controller.js';
import Roles from '../constants/role.enum.js';
import { authMiddleware } from '../middlewares/index.js'
/**
 * @swagger
 * tags:
 *   name: Options
 *   description: Quản lý Option (Key - Value) hệ thống
 */
const router = express.Router();
/**
 * @swagger
 * /options/batch:
 *   post:
 *     summary: Tạo nhiều option cùng lúc
 *     tags: [Options]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Option'
 *     responses:
 *       200:
 *         description: Danh sách option đã tạo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Option'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/batch',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), optionController.createMultipleOptions);
/**
 * @swagger
 * /options:
 *   get:
 *     summary: Lấy tất cả option
 *     tags: [Options]
 *     responses:
 *       200:
 *         description: Danh sách option
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Option'
 */
router.get('/', optionController.getAllOptions);
/**
 * @swagger
 * /options/{key}:
 *   get:
 *     summary: Lấy option theo key
 *     tags: [Options]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: key của option cần lấy
 *     responses:
 *       200:
 *         description: Option tìm được
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Option'
 *       404:
 *         description: Không tìm thấy option
 */
router.get('/:key', optionController.getOptionByKey);
/**
 * @swagger
 * /options/{key}:
 *   put:
 *     summary: Cập nhật option theo key
 *     tags: [Options]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: key của option cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Option'
 *     responses:
 *       200:
 *         description: Option đã cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Option'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy option
 */
router.put('/:key',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), optionController.updateOptionByKey);
/**
 * @swagger
 * /options/{key}:
 *   delete:
 *     summary: Xoá option theo key
 *     tags: [Options]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: key của option cần xoá
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       404:
 *         description: Không tìm thấy option
 */
router.delete('/:key',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), optionController.deleteOptionByKey);

export default router;
