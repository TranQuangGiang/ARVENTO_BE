import express from 'express';
import { authMiddleware } from '../middlewares/index.js';
import addressController from '../controllers/address.controller.js';
import Roles from '../constants/role.enum.js';
import { validate } from "../middlewares/validate.middleware.js";
import { createAddressSchema, updateAddressSchema  } from "../validations/address.validation.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Địa chỉ
 *   description: API quản lý địa chỉ người dùng
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       required:
 *         - ward
 *         - district
 *         - province
 *       properties:
 *         _id:
 *           type: string
 *           description: ID của địa chỉ
 *         user:
 *           type: string
 *           description: ID của người dùng
 *         ward:
 *           type: string
 *           description: Phường/Xã
 *           maxLength: 100
 *         district:
 *           type: string
 *           description: Quận/Huyện
 *           maxLength: 100
 *         province:
 *           type: string
 *           description: Tỉnh/Thành phố
 *           maxLength: 100
 *         phone:
 *           type: string
 *           description: Số điện thoại liên hệ
 *           maxLength: 20
 *         detail:
 *           type: string
 *           description: Chi tiết địa chỉ (số nhà, tên đường...)
 *           maxLength: 500
 *         isDefault:
 *           type: boolean
 *           description: Có phải địa chỉ mặc định không
 *           default: false
 *         label:
 *           type: string
 *           description: Nhãn địa chỉ (Nhà, Công ty...)
 *           maxLength: 50
 *           default: "Nhà"
 *         fullAddress:
 *           type: string
 *           description: Địa chỉ đầy đủ (virtual field)
 *           readOnly: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian tạo
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian cập nhật
 *       example:
 *         ward: "Phường Bến Nghé"
 *         district: "Quận 1"
 *         province: "TP. Hồ Chí Minh"
 *         phone: "0901234567"
 *         detail: "123 Nguyễn Huệ"
 *         isDefault: true
 *         label: "Nhà"
 *     AddressInput:
 *       type: object
 *       required:
 *         - ward
 *         - district
 *         - province
 *       properties:
 *         ward:
 *           type: string
 *           description: Phường/Xã
 *           maxLength: 100
 *         district:
 *           type: string
 *           description: Quận/Huyện
 *           maxLength: 100
 *         province:
 *           type: string
 *           description: Tỉnh/Thành phố
 *           maxLength: 100
 *         phone:
 *           type: string
 *           description: Số điện thoại liên hệ
 *           maxLength: 20
 *         detail:
 *           type: string
 *           description: Chi tiết địa chỉ
 *           maxLength: 500
 *         isDefault:
 *           type: boolean
 *           description: Đặt làm địa chỉ mặc định
 *           default: false
 *         label:
 *           type: string
 *           description: Nhãn địa chỉ
 *           maxLength: 50
 *       example:
 *         ward: "Phường Bến Nghé"
 *         district: "Quận 1"
 *         province: "TP. Hồ Chí Minh"
 *         phone: "0901234567"
 *         detail: "123 Nguyễn Huệ"
 *         isDefault: false
 *         label: "Nhà"
 */

/**
 * @swagger
 * /addresses/me:
 *   get:
 *     summary: Lấy danh sách địa chỉ của tôi
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bản ghi mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách địa chỉ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 docs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *                 totalDocs:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Chưa xác thực
 */
router.get('/me', authMiddleware.authenticateToken, addressController.getMyAddresses);

/**
 * @swagger
 * /addresses/me/default:
 *   get:
 *     summary: Lấy địa chỉ mặc định của tôi
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Địa chỉ mặc định
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       404:
 *         description: Không tìm thấy địa chỉ mặc định
 *       401:
 *         description: Chưa xác thực
 */
router.get('/me/default', authMiddleware.authenticateToken, addressController.getMyDefaultAddress);

/**
 * @swagger
 * /addresses/me:
 *   post:
 *     summary: Tạo địa chỉ mới cho tôi
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       201:
 *         description: Địa chỉ đã được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 */
router.post('/me', authMiddleware.authenticateToken,  validate({ body: createAddressSchema }), addressController.createMyAddress);

/**
 * @swagger
 * /addresses/{id}:
 *   get:
 *     summary: Lấy thông tin địa chỉ theo ID
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ
 *     responses:
 *       200:
 *         description: Thông tin địa chỉ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       404:
 *         description: Không tìm thấy địa chỉ
 *       403:
 *         description: Không có quyền truy cập
 *       401:
 *         description: Chưa xác thực
 */
router.get('/:id', authMiddleware.authenticateToken, addressController.getAddressById);

/**
 * @swagger
 * /addresses/{id}:
 *   put:
 *     summary: Cập nhật địa chỉ
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       200:
 *         description: Địa chỉ đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy địa chỉ
 *       403:
 *         description: Không có quyền truy cập
 *       401:
 *         description: Chưa xác thực
 */
router.put('/:id', authMiddleware.authenticateToken,validate({ body: updateAddressSchema }), addressController.updateAddress);

/**
 * @swagger
 * /addresses/{id}:
 *   delete:
 *     summary: Xóa địa chỉ
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ
 *     responses:
 *       200:
 *         description: Địa chỉ đã được xóa
 *       404:
 *         description: Không tìm thấy địa chỉ
 *       403:
 *         description: Không có quyền truy cập
 *       401:
 *         description: Chưa xác thực
 */
router.delete('/:id', authMiddleware.authenticateToken, addressController.deleteAddress);

/**
 * @swagger
 * /addresses/{id}/set-default:
 *   patch:
 *     summary: Đặt địa chỉ làm mặc định
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ
 *     responses:
 *       200:
 *         description: Đã đặt làm địa chỉ mặc định
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       404:
 *         description: Không tìm thấy địa chỉ
 *       403:
 *         description: Không có quyền truy cập
 *       401:
 *         description: Chưa xác thực
 */
router.patch('/:id/set-default', authMiddleware.authenticateToken, addressController.setDefaultAddress);

// Admin routes
/**
 * @swagger
 * /addresses/user/{userId}:
 *   get:
 *     summary: Lấy danh sách địa chỉ của user (Admin only)
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bản ghi mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách địa chỉ
 *       403:
 *         description: Không có quyền truy cập
 *       401:
 *         description: Chưa xác thực
 */
router.get('/user/:userId', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), addressController.getAddresses);

/**
 * @swagger
 * /addresses/user/{userId}/default:
 *   get:
 *     summary: Lấy địa chỉ mặc định của user (Admin only)
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Địa chỉ mặc định
 *       404:
 *         description: Không tìm thấy địa chỉ mặc định
 *       403:
 *         description: Không có quyền truy cập
 *       401:
 *         description: Chưa xác thực
 */
router.get('/user/:userId/default', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), addressController.getDefaultAddress);

/**
 * @swagger
 * /addresses/user/{userId}:
 *   post:
 *     summary: Tạo địa chỉ cho user (Admin only)
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       201:
 *         description: Địa chỉ đã được tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       403:
 *         description: Không có quyền truy cập
 *       401:
 *         description: Chưa xác thực
 */
router.post('/user/:userId', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), addressController.createAddress);

export default router;
