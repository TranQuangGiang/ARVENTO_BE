import { Router } from 'express';
import productController from '../controllers/product.controller.js';
// import authMiddleware from '../middlewares/auth.middleware.js';
import { uploadProductImages, processProductImages, handleUploadImportFile  } from '../middlewares/upload.middleware.js';
// Destructuring từ default export
import Roles from '../constants/role.enum.js';
import { authMiddleware } from '../middlewares/index.js'

// Khởi tạo router
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Quản lý sản phẩm
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Lấy tất cả sản phẩm
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Trả về danh sách sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *
 *   post:
 *     summary: Tạo sản phẩm mới
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *
 * /products/{id}:
 *   get:
 *     summary: Lấy sản phẩm theo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Thông tin sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Không tìm thấy sản phẩm
 *
 *   put:
 *     summary: Cập nhật sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *
 *   delete:
 *     summary: Xoá sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 *
 * /products/import:
 *   post:
 *     summary: Import sản phẩm từ file
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import thành công
 *
 * /products/export:
 *   get:
 *     summary: Export danh sách sản phẩm
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Xuất thành công
 *
 * /products/search:
 *   get:
 *     summary: Tìm kiếm sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trả về kết quả tìm kiếm
 *
 * /products/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái hiển thị sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Public routes
router.get('/export', productController.exportProducts);
router.get('/search', productController.searchProducts);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
// router.get('/search', productController.searchProducts);

router.get('/related/:id', productController.getRelatedProducts); //Lấy danh sách sản phẩm liên quan (cùng danh mục) với sản phẩm có ID được cung cấp

// Admin routes
router.post('/',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), [uploadProductImages, processProductImages], productController.createProduct);
router.put('/:id',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), [uploadProductImages, processProductImages], productController.updateProduct);
router.delete('/:id',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), productController.deleteProduct);
router.patch('/:id/status',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),productController.updateProductStatus);
router.post('/import',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),handleUploadImportFile , productController.importProducts);
// router.get('/export', productController.exportProducts);
router.post(
  '/:productId/options',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),
  productController.setOptions 
);
export default router;
