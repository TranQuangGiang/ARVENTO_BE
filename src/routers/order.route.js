import express from "express";
import multer from 'multer';
import orderController from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/index.js";
import { validate } from "../middlewares/validate.middleware.js";
import Roles from "../constants/role.enum.js";
import { createOrderSchema, createOrderFromCartSchema, adminUpdateOrderStatusSchema, getOrdersQuerySchema } from "../validations/order.validation.js";
const upload = multer({ dest: 'uploads/returns/' });
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Order
 *   description: API quản lý đơn hàng
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderVariant:
 *       type: object
 *       required:
 *         - color
 *         - size
 *         - sku
 *         - price
 *         - stock
 *       properties:
 *         color:
 *           type: object
 *           required:
 *             - name
 *           properties:
 *             name:
 *               type: string
 *               maxLength: 50
 *               description: Tên màu sắc
 *             hex:
 *               type: string
 *               maxLength: 20
 *               description: Mã màu hex
 *           description: Thông tin màu sắc sản phẩm
 *         size:
 *           type: string
 *           maxLength: 20
 *           description: Kích cỡ sản phẩm
 *         sku:
 *           type: string
 *           maxLength: 100
 *           description: Mã SKU của variant
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Giá sản phẩm
 *         stock:
 *           type: number
 *           minimum: 0
 *           description: Số lượng tồn kho
 *         image:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               description: URL hình ảnh
 *             alt:
 *               type: string
 *               maxLength: 100
 *               description: Alt text cho hình ảnh
 *
 *     OrderItem:
 *       type: object
 *       required:
 *         - product
 *         - selected_variant
 *         - quantity
 *         - unit_price
 *         - total_price
 *       properties:
 *         product:
 *           type: string
 *           description: ID sản phẩm
 *         selected_variant:
 *           $ref: '#/components/schemas/OrderVariant'
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           maximum: 999
 *           description: Số lượng sản phẩm
 *         unit_price:
 *           type: number
 *           minimum: 0
 *           description: Giá đơn vị
 *         total_price:
 *           type: number
 *           minimum: 0
 *           description: Tổng giá
 *
 *     AppliedCoupon:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           description: Mã giảm giá
 *         discount_amount:
 *           type: number
 *           description: Số tiền giảm
 *         discount_type:
 *           type: string
 *           enum: [percentage, fixed, fixed_amount]
 *           description: Loại giảm giá
 *
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID đơn hàng
 *         user:
 *           type: string
 *           description: ID người dùng
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         subtotal:
 *           type: number
 *           minimum: 0
 *           description: Tổng phụ
 *         applied_coupon:
 *           $ref: '#/components/schemas/AppliedCoupon'
 *         total:
 *           type: number
 *           minimum: 0
 *           description: Tổng tiền sau giảm giá
 *         shipping_address:
 *           type: string
 *           description: ID địa chỉ giao hàng
 *         billing_address:
 *           type: string
 *           description: ID địa chỉ thanh toán
 *         payment_method:
 *           type: string
 *           enum: [cod, banking, zalopay, momo]
 *           description: Phương thức thanh toán
 *         payment_status:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, refunded]
 *           description: Trạng thái thanh toán
 *         status:
 *           type: string
 *           enum: [pending, confirmed, processing, shipping, delivered, completed, cancelled, returned]
 *           description: Trạng thái đơn hàng
 *         note:
 *           type: string
 *           description: Ghi chú đơn hàng
 *         timeline:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               changedBy:
 *                 type: string
 *               changedAt:
 *                 type: string
 *                 format: date-time
 *               note:
 *                 type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

// ==================== ORDER ROUTES ====================

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Tạo đơn hàng mới với cấu trúc chi tiết
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - subtotal
 *               - total
 *               - shipping_address
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   $ref: '#/components/schemas/OrderItem'
 *               subtotal:
 *                 type: number
 *                 minimum: 0
 *                 description: Tổng phụ
 *               applied_coupon:
 *                 $ref: '#/components/schemas/AppliedCoupon'
 *               total:
 *                 type: number
 *                 minimum: 0
 *                 description: Tổng tiền
 *               shipping_address:
 *                 type: string
 *                 description: ID địa chỉ giao hàng
 *               billing_address:
 *                 type: string
 *                 description: ID địa chỉ thanh toán
 *               payment_method:
 *                 type: string
 *                 enum: [cod, banking, zalopay, momo]
 *                 default: cod
 *               note:
 *                 type: string
 *                 maxLength: 500
 *           example:
 *             items:
 *               - product: "60d5ecb74b24c72b8c8b4567"
 *                 selected_variant:
 *                   color:
 *                     name: "Đỏ"
 *                     hex: "#FF0000"
 *                   size: "M"
 *                   sku: "VAR-M-Red-123456"
 *                   price: 299000
 *                   stock: 50
 *                 quantity: 2
 *                 unit_price: 299000
 *                 total_price: 598000
 *             subtotal: 598000
 *             total: 598000
 *             shipping_address: "60d5ecb74b24c72b8c8b4568"
 *             payment_method: "cod"
 *             note: "Giao hàng nhanh"
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công
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
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không đủ stock
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Sản phẩm hoặc địa chỉ không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post("/", authMiddleware.authenticateToken, validate({ body: createOrderSchema }), orderController.createOrder);

/**
 * @swagger
 * /orders/from-cart:
 *   post:
 *     summary: Tạo đơn hàng từ giỏ hàng
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shipping_address
 *             properties:
 *               shipping_address:
 *                 type: string
 *                 description: ID địa chỉ giao hàng
 *               billing_address:
 *                 type: string
 *                 description: ID địa chỉ thanh toán
 *               payment_method:
 *                 type: string
 *                 enum: [cod, banking, zalopay, momo]
 *                 default: cod
 *               note:
 *                 type: string
 *                 maxLength: 500
 *               use_cart_coupon:
 *                 type: boolean
 *                 default: true
 *                 description: Có sử dụng coupon từ giỏ hàng không
 *           example:
 *             shipping_address: "60d5ecb74b24c72b8c8b4568"
 *             payment_method: "cod"
 *             note: "Giao hàng nhanh"
 *             use_cart_coupon: true
 *     responses:
 *       201:
 *         description: Tạo đơn hàng từ giỏ hàng thành công
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
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Giỏ hàng trống hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Địa chỉ không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post("/from-cart", authMiddleware.authenticateToken, validate({ body: createOrderFromCartSchema }), orderController.createOrderFromCart);

/**
 * @swagger
 * /orders/stats:
 *   get:
 *     summary: Thống kê tổng quan đơn hàng (admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lấy thống kê thành công }
 */
router.get("/stats", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), orderController.getOrderStats);

/**
 * @swagger
 * /orders/revenue:
 *   get:
 *     summary: Doanh thu theo ngày/tháng (admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [day, month] }
 *     responses:
 *       200: { description: Lấy doanh thu thành công }
 */
router.get("/revenue", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), orderController.getRevenueByDate);

/**
 * @swagger
 * /orders/recent:
 *   get:
 *     summary: Đơn hàng mới nhất (admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Lấy đơn hàng mới nhất thành công }
 */
router.get("/recent", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), orderController.getRecentOrders);

/**
 * @swagger
 * /orders/export:
 *   get:
 *     summary: Xuất đơn hàng ra file (admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Xuất file thành công }
 */
router.get("/export", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), orderController.exportOrders);

/**
 * @swagger
 * /orders/my:
 *   get:
 *     summary: Lấy danh sách đơn hàng của tôi
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipping, delivered, completed, cancelled, returned]
 *         description: Lọc theo trạng thái đơn hàng
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, refunded]
 *         description: Lọc theo trạng thái thanh toán
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [cod, banking, zalopay, momo]
 *         description: Lọc theo phương thức thanh toán
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Số lượng đơn hàng mỗi trang
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at, -created_at, total, -total, status, -status]
 *           default: -created_at
 *         description: Sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng thành công
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
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.get("/my", authMiddleware.authenticateToken, validate({ query: getOrdersQuerySchema }), orderController.getMyOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đơn hàng
 *     responses:
 *       200:
 *         description: Lấy chi tiết đơn hàng thành công
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
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập đơn hàng này
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */
router.get("/:id", authMiddleware.authenticateToken, orderController.getOrderDetail);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Hủy đơn hàng của tôi
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đơn hàng
 *     responses:
 *       200:
 *         description: Hủy đơn hàng thành công
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
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Không thể hủy đơn hàng ở trạng thái hiện tại
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền hủy đơn hàng này
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */
router.patch("/:id/cancel", authMiddleware.authenticateToken, orderController.cancelOrder);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Lấy tất cả đơn hàng (admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: user
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Lấy danh sách đơn hàng thành công }
 */

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái đơn hàng (admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipping, delivered, completed, cancelled, returned]
 *                 description: Trạng thái mới của đơn hàng
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 description: Ghi chú về việc thay đổi trạng thái
 *           example:
 *             status: "confirmed"
 *             note: "Đơn hàng đã được xác nhận"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
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
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Trạng thái không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền admin
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */
router.patch(
  "/:id/status",
  authMiddleware.authenticateToken,
  async (req, res, next) => {
    const role = req.user.role;
    const { status: newStatus } = req.body;

    if (role === Roles.ADMIN) return next();

    if (role === Roles.USER && newStatus === "completed") {
      return next();
    }

    return res.status(403).json({ message: "Bạn không có quyền cập nhật trạng thái đơn hàng" });
  },
  validate({ body: adminUpdateOrderStatusSchema }),
  orderController.updateOrderStatus
);

/**
 * @swagger
 * /orders/{id}/request-return:
 *   patch:
 *     summary: Khách hàng yêu cầu trả hàng
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_return_requested
 *             properties:
 *               is_return_requested:
 *                 type: boolean
 *                 enum: [true]
 *                 description: Bắt buộc phải là true
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 description: Lý do trả hàng hoặc ghi chú của khách hàng
 *           example:
 *             is_return_requested: true
 *             note: "Sản phẩm bị lỗi, cần hoàn trả"
 *     responses:
 *       200:
 *         description: Yêu cầu trả hàng đã được ghi nhận
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
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc đơn hàng chưa được giao
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền thao tác với đơn hàng này
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */
router.patch("/:id/request-return", authMiddleware.authenticateToken, orderController.clientRequestReturn);

/**
 * @swagger
 * /orders/{id}/timeline:
 *   get:
 *     summary: Lấy lịch sử trạng thái đơn hàng
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lấy timeline thành công }
 *       404: { description: Không tìm thấy đơn hàng }
 */
router.get("/:id/timeline", authMiddleware.authenticateToken, orderController.getOrderTimeline);

/**
 * @swagger
 * /orders/{id}/confirm-return:
 *   post:
 *     summary: Xác nhận hoàn hàng và gửi ảnh bằng chứng
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id  # ✅ đúng với route `/:id/confirm-return`
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:  # ✅ đúng với field bạn upload `upload.array('images', 5)`
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Xác nhận hoàn hàng thành công
 *       400:
 *         description: Thiếu ảnh
 *       404:
 *         description: Đơn hàng không tồn tại
 *       500:
 *         description: Lỗi server
 */

router.post('/:id/confirm-return', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), upload.array('images', 5), orderController.confirmReturnController);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Lấy tất cả đơn hàng (admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipping, delivered, completed, cancelled, returned]
 *         description: Lọc theo trạng thái đơn hàng
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, refunded]
 *         description: Lọc theo trạng thái thanh toán
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [cod, banking, zalopay, momo]
 *         description: Lọc theo phương thức thanh toán
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: ID người dùng
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Số lượng đơn hàng mỗi trang
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at, -created_at, total, -total, status, -status]
 *           default: -created_at
 *         description: Sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng thành công
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
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi server
 */

// Admin route - phải đặt cuối cùng để tránh conflict với các routes khác
router.get("/", authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), validate({ query: getOrdersQuerySchema }), orderController.getAllOrders);

export default router;
