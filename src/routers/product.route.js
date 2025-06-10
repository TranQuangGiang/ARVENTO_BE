import express from "express";
import { upload } from '../config/multer.config.js';
// import { processProductImages } from '../middlewares/uploadv2.middleware.js';
import { productController } from "../controllers/index.js";
import { uploadProductImages,processProductImages } from "../middlewares/upload.middleware.js";
import { authMiddleware } from '../middlewares/index.js'
import Roles from '../constants/role.enum.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Các API liên quan sản phẩm và quản lý sản phẩm
 */

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Product]
 *     summary: Lấy danh sách sản phẩm với lọc, phân trang và sắp xếp
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Từ khóa tìm kiếm (tên, mô tả)
 *       - in: query
 *         name: category_id
 *         schema: { type: string }
 *         description: ID danh mục
 *       - in: query
 *         name: tags
 *         schema: { type: string }
 *         description: Danh sách tags, phân tách bằng dấu phẩy
 *       - in: query
 *         name: color
 *         schema: { type: string }
 *         description: Lọc theo màu trong biến thể
 *       - in: query
 *         name: size
 *         schema: { type: string }
 *         description: Lọc theo size trong biến thể
 *       - in: query
 *         name: priceMin
 *         schema: { type: number }
 *         description: Giá thấp nhất
 *       - in: query
 *         name: priceMax
 *         schema: { type: number }
 *         description: Giá cao nhất
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *         description: Giới hạn mỗi trang
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *         description: Trường sắp xếp
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDocs: { type: integer, example: 100 }
 *                 limit: { type: integer, example: 10 }
 *                 totalPages: { type: integer, example: 10 }
 *                 page: { type: integer, example: 1 }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */

router.get("/", productController.getAllProducts);
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Product]
 *     summary: Lấy chi tiết sản phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chi tiết sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Không tìm thấy
 */
router.get("/:id", productController.getProductById);
/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Product]
 *     summary: Thêm sản phẩm mới
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               category_id: { type: string }
 *               price: { type: number }
 *               tags: { type: string }
 *               images: 
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Dữ liệu không hợp lệ
 */

router.post("/", 
  authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),
  uploadProductImages,
  processProductImages,
  productController.createProduct
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     tags: [Product]
 *     summary: Cập nhật sản phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               category_id: { type: string }
 *               price: { type: number }
 *               tags: { type: string }
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy
 */

router.put("/:id", 
  authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),
  uploadProductImages,
  processProductImages,
  productController.updateProduct
);
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     tags: [Product]
 *     summary: Xóa sản phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy
 */


router.delete("/:id",authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), productController.deleteProduct);
/**
 * @swagger
 * /products/import:
 *   post:
 *     tags:
 *       - Product
 *     summary: Nhập danh sách sản phẩm từ file Excel/CSV
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
 *         description: Nhập dữ liệu thành công
 *       400:
 *         description: Lỗi định dạng file hoặc dữ liệu không hợp lệ
 */
router.post('/import', upload.single('file'), productController.importProducts);


export default router;
