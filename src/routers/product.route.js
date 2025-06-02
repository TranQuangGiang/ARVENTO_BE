import express from "express";
import multer from 'multer';
import { productController } from "../controllers/index.js";
const upload = multer({ dest: 'uploads/' });
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
 *     tags:
 *       - Product
 *     summary: Lấy danh sách sản phẩm với lọc, phân trang và sắp xếp
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm trên tên và mô tả sản phẩm (regex, không phân biệt hoa thường)
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Lọc theo tên sản phẩm (regex, không phân biệt hoa thường)
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Lọc theo ID category chính xác
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Lọc theo danh sách tags (phân tách bằng dấu phẩy)
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Lọc theo màu (chính xác, nằm trong variants)
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *         description: Lọc theo kích cỡ (chính xác, nằm trong variants)
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *         description: Giá tối thiểu (lọc khoảng giá)
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *         description: Giá tối đa (lọc khoảng giá)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Trang hiện tại, mặc định 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Số sản phẩm trên mỗi trang, tối đa 50
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: "Trường để sắp xếp (vd: createdAt, price,...)"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Thứ tự sắp xếp (asc hoặc desc)
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm theo điều kiện lọc, phân trang và sắp xếp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDocs:
 *                   type: integer
 *                   description: Tổng số sản phẩm
 *                   example: 100
 *                 limit:
 *                   type: integer
 *                   description: Số sản phẩm trên mỗi trang
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   description: Tổng số trang
 *                   example: 10
 *                 page:
 *                   type: integer
 *                   description: Trang hiện tại
 *                   example: 1
 *                 pagingCounter:
 *                   type: integer
 *                   description: Số thứ tự của sản phẩm đầu tiên trên trang hiện tại
 *                   example: 1
 *                 hasPrevPage:
 *                   type: boolean
 *                   description: Có trang trước không
 *                   example: false
 *                 hasNextPage:
 *                   type: boolean
 *                   description: Có trang tiếp theo không
 *                   example: true
 *                 prevPage:
 *                   type: integer
 *                   nullable: true
 *                   description: Số trang trước (nếu có)
 *                   example: null
 *                 nextPage:
 *                   type: integer
 *                   nullable: true
 *                   description: Số trang tiếp theo (nếu có)
 *                   example: 2
 *                 data:
 *                   type: array
 *                   description: Danh sách sản phẩm
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get("/", productController.getAllProducts);
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags:
 *       - Product
 *     summary: Lấy chi tiết sản phẩm theo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm cần lấy
 *     responses:
 *       200:
 *         description: Thông tin chi tiết sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get("/:id", productController.getProductById);
/**
 * @swagger
 * /products:
 *   post:
 *     tags:
 *       - Product
 *     summary: Tạo sản phẩm mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Tạo thành công sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 */
router.post("/", productController.createProduct);
/**
 * @swagger
 * /products/{id}:
 *   put:
 *     tags:
 *       - Product
 *     summary: Cập nhật thông tin sản phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Cập nhật thành công sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.put("/:id", productController.updateProduct);
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     tags:
 *       - Product
 *     summary: Xóa sản phẩm theo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành công sản phẩm
 *       404:
 *         description: Không tìm thấy sản phẩm
 */

router.delete("/:id", productController.deleteProduct);
router.post('/import', upload.single('file'), productController.importProducts);


export default router;
