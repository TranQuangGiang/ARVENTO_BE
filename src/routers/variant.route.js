// routes/variant.routes.js
import express from 'express';
import VariantController from '../controllers/variant.controller.js';
import VariantValidation from '../validations/variant.validation.js';
// import ProductController from '../controllers/product.controller.js';
import uploadMiddleware from '../middlewares/upload.middleware.js';
// import { validateProductCreate } from '../middlewares/product.middleware.js';
import Roles from '../constants/role.enum.js';
import { authMiddleware } from '../middlewares/index.js'
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Variants
 *   description: Quản lý các biến thể sản phẩm
 */
// ========== CLIENT ROUTES ==========
/**
 * @swagger
 * variants/products/{productId}/variants/options:
 *   get:
 *     summary: Lấy danh sách tuỳ chọn size / màu
 *     tags: [Variants]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách tuỳ chọn
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     sizes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["S", "M", "L"]
 *                     colors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Đỏ", "Xanh"]
 */

router.get('/products/:productId/variants/options', VariantController.getVariantOptions);
/**
 * @swagger
 * /variants/products/{productId}/variants:
 *   get:
 *     summary: Lấy danh sách biến thể của sản phẩm
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Danh sách biến thể
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Variant'
 *       401:
 *         description: Không có quyền truy cập
 */

router.get('/products/:productId/variants',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), VariantController.getAdminVariants);
/**
 * @swagger
 * /variants/products/{productId}/variants/{id}:
 *   get:
 *     summary: Lấy chi tiết một biến thể
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết biến thể
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Variant'
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy biến thể
 */
router.get('/products/:productId/variants/:id',authMiddleware.authenticateToken, VariantController.getVariantById);


// ========== ADMIN ROUTES ==========
// Sinh tự động biến thể từ options
/**
 * @swagger
 * variants/products/{productId}/variants/generate:
 *   post:
 *     summary: Sinh tự động biến thể từ options
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Các biến thể đã được tạo
 *       401:
 *         description: Không có quyền truy cập
 */
router.post(
  '/:productId/variants/generate',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),
  VariantController.generateVariants
);

// Cập nhật 1 biến thể
/**
 * @swagger
 * variants/products/{productId}/variants/{id}:
 *   put:
 *     summary: Cập nhật một biến thể
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               size:
 *                 type: string
 *               color:
 *                 type: string
 *               stock:
 *                 type: integer
 *               sku:
 *                 type: string
 *               price:
 *                 type: number
 *               imageIndex:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Biến thể đã được cập nhật
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 */
router.put(
  '/products/:productId/variants/:id',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),
 uploadMiddleware.uploadProductImages,
  uploadMiddleware.processProductImages,
  VariantValidation.validateVariantJoi,
  VariantController.updateVariant
);

// // Cập nhật nhiều biến thể cùng lúc
// router.patch(
//   '/products/:productId/variants/bulk-update',
//   VariantController.bulkUpdateVariants
// );

// Xoá 1 biến thể
/**
 * @swagger
 * variants/products/{productId}/variants/{id}:
 *   delete:
 *     summary: Xoá một biến thể
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Biến thể đã được xoá
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy biến thể
 */

router.delete(
  '/products/:productId/variants/:id',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),
  VariantController.deleteVariant
);

// // Xoá toàn bộ biến thể
// router.delete(
//   '/products/:productId/variants',
//   VariantController.deleteAllVariants
// );

// // Import biến thể từ file Excel
// router.post(
//   '/products/:productId/variants/import',
//   uploadMiddleware.handleUploadImportFile,
//   uploadMiddleware.uploadProductImages,         // xử lý memory upload (ảnh)
//   uploadMiddleware.processProductImages,        // resize + gán vào req.variantImages
//   VariantController.importVariants
// );

// // Export biến thể ra file Excel
// router.get(
//   '/products/:productId/variants/export',
//   VariantController.exportVariants
// );

export default router;
