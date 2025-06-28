import express from "express";
import cartController from "../controllers/cart.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/index.js";
import { addItemSchema, updateQuantitySchema, removeItemSchema, applyCouponSchema, saveForLaterSchema, moveToCartSchema, getCartQuerySchema, bulkUpdateSchema } from "../validations/cart.validation.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: API quản lý giỏ hàng
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CartVariant:
 *       type: object
 *       required:
 *         - color
 *         - size
 *         - price
 *         - stock
 *       properties:
 *         color:
 *           type: string
 *           maxLength: 50
 *           description: Màu sắc sản phẩm
 *         size:
 *           type: string
 *           maxLength: 20
 *           description: Kích cỡ sản phẩm
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Giá sản phẩm
 *         stock:
 *           type: number
 *           minimum: 0
 *           description: Số lượng tồn kho
 *
 *     CartItem:
 *       type: object
 *       properties:
 *         product:
 *           type: string
 *           description: ID sản phẩm
 *         selected_variant:
 *           $ref: '#/components/schemas/CartVariant'
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
 *         saved_for_later:
 *           type: boolean
 *           description: Có phải lưu để mua sau không
 *         added_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian thêm vào giỏ
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian cập nhật cuối
 *
 *     Cart:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID giỏ hàng
 *         user:
 *           type: string
 *           description: ID người dùng
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         subtotal:
 *           type: number
 *           minimum: 0
 *           description: Tổng phụ
 *         applied_coupon:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               description: Mã giảm giá
 *             discount_amount:
 *               type: number
 *               description: Số tiền giảm
 *             discount_type:
 *               type: string
 *               enum: [percentage, fixed]
 *               description: Loại giảm giá
 *         total:
 *           type: number
 *           minimum: 0
 *           description: Tổng tiền sau giảm giá
 *         items_count:
 *           type: integer
 *           description: Số lượng items trong giỏ
 *         saved_items_count:
 *           type: integer
 *           description: Số lượng items lưu để mua sau
 *         total_quantity:
 *           type: integer
 *           description: Tổng số lượng sản phẩm
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *
 *     AddItemRequest:
 *       type: object
 *       required:
 *         - product_id
 *         - selected_variant
 *         - quantity
 *       properties:
 *         product_id:
 *           type: string
 *           description: ID sản phẩm
 *         selected_variant:
 *           $ref: '#/components/schemas/CartVariant'
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           maximum: 999
 *           description: Số lượng
 *
 *     UpdateQuantityRequest:
 *       type: object
 *       required:
 *         - product_id
 *         - selected_variant
 *         - quantity
 *       properties:
 *         product_id:
 *           type: string
 *           description: ID sản phẩm
 *         selected_variant:
 *           type: object
 *           required:
 *             - color
 *             - size
 *           properties:
 *             color:
 *               type: string
 *               maxLength: 50
 *             size:
 *               type: string
 *               maxLength: 20
 *         quantity:
 *           type: integer
 *           minimum: 0
 *           maximum: 999
 *           description: Số lượng mới (0 để xóa)
 *
 *     RemoveItemRequest:
 *       type: object
 *       required:
 *         - product_id
 *         - selected_variant
 *       properties:
 *         product_id:
 *           type: string
 *           description: ID sản phẩm
 *         selected_variant:
 *           type: object
 *           required:
 *             - color
 *             - size
 *           properties:
 *             color:
 *               type: string
 *               maxLength: 50
 *             size:
 *               type: string
 *               maxLength: 20
 *
 *     ApplyCouponRequest:
 *       type: object
 *       required:
 *         - coupon_code
 *       properties:
 *         coupon_code:
 *           type: string
 *           minLength: 3
 *           maxLength: 20
 *           pattern: '^[A-Z0-9]+$'
 *           description: Mã giảm giá
 */

// ==================== CART ROUTES ====================

/**
 * @swagger
 * /carts:
 *   get:
 *     summary: Lấy giỏ hàng của user hiện tại
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: include_saved
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Có bao gồm items "save for later" không
 *     responses:
 *       200:
 *         description: Lấy giỏ hàng thành công
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
 *                   $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.get("/", authMiddleware.authenticateToken, validate({ query: getCartQuerySchema }), cartController.getCart);

/**
 * @swagger
 * /carts/items:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddItemRequest'
 *           example:
 *             product_id: "60d5ecb74b24c72b8c8b4567"
 *             selected_variant:
 *               color: "Đỏ"
 *               size: "M"
 *               price: 299000
 *               stock: 50
 *             quantity: 2
 *     responses:
 *       201:
 *         description: Thêm sản phẩm thành công
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
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không đủ stock
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Sản phẩm không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post("/items", authMiddleware.authenticateToken, validate({ body: addItemSchema }), cartController.addItem);

/**
 * @swagger
 * /carts/items:
 *   put:
 *     summary: Cập nhật số lượng sản phẩm trong giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQuantityRequest'
 *           example:
 *             product_id: "60d5ecb74b24c72b8c8b4567"
 *             selected_variant:
 *               color: "Đỏ"
 *               size: "M"
 *             quantity: 3
 *     responses:
 *       200:
 *         description: Cập nhật số lượng thành công
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
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không đủ stock
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Sản phẩm không tồn tại trong giỏ hàng
 *       500:
 *         description: Lỗi server
 */
router.put("/items", authMiddleware.authenticateToken, validate({ body: updateQuantitySchema }), cartController.updateItemQuantity);

/**
 * @swagger
 * /carts/items:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveItemRequest'
 *           example:
 *             product_id: "60d5ecb74b24c72b8c8b4567"
 *             selected_variant:
 *               color: "Đỏ"
 *               size: "M"
 *     responses:
 *       200:
 *         description: Xóa sản phẩm thành công
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
 *                   $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Sản phẩm không tồn tại trong giỏ hàng
 *       500:
 *         description: Lỗi server
 */
router.delete("/items", authMiddleware.authenticateToken,(req, res, next) => {
    console.log("BODY RECEIVED >>>", JSON.stringify(req.body, null, 2));
    next();
  }, validate({ body: removeItemSchema }), cartController.removeItem);

/**
 * @swagger
 * /carts:
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa giỏ hàng thành công
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
 *                   $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.delete("/", authMiddleware.authenticateToken, cartController.clearCart);
//test sau
/**
 * @swagger
 * /carts/coupons:
 *   post:
 *     summary: Áp dụng mã giảm giá
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplyCouponRequest'
 *           example:
 *             coupon_code: "SALE20"
 *     responses:
 *       200:
 *         description: Áp dụng mã giảm giá thành công
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
 *                     cart:
 *                       $ref: '#/components/schemas/Cart'
 *                     couponInfo:
 *                       type: object
 *                       description: Thông tin chi tiết về coupon
 *       400:
 *         description: Mã giảm giá không hợp lệ hoặc hết hạn
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.post("/coupons", authMiddleware.authenticateToken, validate({ body: applyCouponSchema }), cartController.applyCoupon);
//sửa lại 
/**
 * @swagger
 * /carts/coupons:
 *   delete:
 *     summary: Xóa mã giảm giá
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa mã giảm giá thành công
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
 *                   $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.delete("/coupons", authMiddleware.authenticateToken, cartController.removeCoupon);
//test sau
/**
 * @swagger
 * /carts/items/save-later:
 *   post:
 *     summary: Lưu sản phẩm để mua sau
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveItemRequest'
 *           example:
 *             product_id: "60d5ecb74b24c72b8c8b4567"
 *             selected_variant:
 *               color: "Đỏ"
 *               size: "M"
 *     responses:
 *       200:
 *         description: Lưu sản phẩm thành công
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
 *                   $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Sản phẩm không tồn tại trong giỏ hàng
 *       500:
 *         description: Lỗi server
 */
router.post("/items/save-later", authMiddleware.authenticateToken, validate({ body: saveForLaterSchema }), cartController.saveForLater);

/**
 * @swagger
 * /carts/items/move-to-cart:
 *   post:
 *     summary: Chuyển sản phẩm từ "save for later" về giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveItemRequest'
 *           example:
 *             product_id: "60d5ecb74b24c72b8c8b4567"
 *             selected_variant:
 *               color: "Đỏ"
 *               size: "M"
 *     responses:
 *       200:
 *         description: Chuyển sản phẩm thành công
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
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Không đủ stock
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Sản phẩm không tồn tại trong danh sách lưu sau
 *       500:
 *         description: Lỗi server
 */
router.post("/items/move-to-cart", authMiddleware.authenticateToken, validate({ body: moveToCartSchema }), cartController.moveToCart);

/**
 * @swagger
 * /carts/bulk-update:
 *   put:
 *     summary: Cập nhật nhiều sản phẩm cùng lúc
 *     tags: [Cart]
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
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - selected_variant
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     selected_variant:
 *                       type: object
 *                       required:
 *                         - color
 *                         - size
 *                       properties:
 *                         color:
 *                           type: string
 *                         size:
 *                           type: string
 *                     quantity:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 999
 *           example:
 *             items:
 *               - product_id: "60d5ecb74b24c72b8c8b4567"
 *                 selected_variant:
 *                   color: "Đỏ"
 *                   size: "M"
 *                 quantity: 3
 *               - product_id: "60d5ecb74b24c72b8c8b4568"
 *                 selected_variant:
 *                   color: "Xanh"
 *                   size: "L"
 *                 quantity: 0
 *     responses:
 *       200:
 *         description: Cập nhật thành công
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
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không đủ stock
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.put("/bulk-update", authMiddleware.authenticateToken, validate({ body: bulkUpdateSchema }), cartController.bulkUpdateItemsController);// sửa lại vì khi sửa nó lại update thêm mới trùng với item  thêmn vào giỏ

/**
 * @swagger
 * /carts/summary:
 *   get:
 *     summary: Lấy tóm tắt giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy tóm tắt thành công
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
 *                     total_items:
 *                       type: integer
 *                       description: Số lượng items trong giỏ
 *                     total_quantity:
 *                       type: integer
 *                       description: Tổng số lượng sản phẩm
 *                     subtotal:
 *                       type: number
 *                       description: Tổng phụ
 *                     discount_amount:
 *                       type: number
 *                       description: Số tiền giảm giá
 *                     total:
 *                       type: number
 *                       description: Tổng tiền sau giảm giá
 *                     saved_items_count:
 *                       type: integer
 *                       description: Số items lưu để mua sau
 *                     applied_coupon:
 *                       type: string
 *                       nullable: true
 *                       description: Mã giảm giá đang áp dụng
 *                     last_updated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.get("/summary", authMiddleware.authenticateToken, cartController.getCartSummary);
//thêm hiển thị discount_amount
/**
 * @swagger
 * /carts/sync-prices:
 *   post:
 *     summary: Đồng bộ giá của tất cả items trong cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đồng bộ giá thành công
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
 *                   $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.post("/sync-prices", authMiddleware.authenticateToken, cartController.syncCartPrices);
//thêm hiển thị discount_amount
/**
 * @swagger
 * /carts/validate:
 *   post:
 *     summary: Validate giỏ hàng trước khi checkout
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Giỏ hàng hợp lệ
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
 *                     isValid:
 *                       type: boolean
 *                     cart:
 *                       $ref: '#/components/schemas/Cart'
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Giỏ hàng có lỗi
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.post("/validate", authMiddleware.authenticateToken, cartController.validateCartForCheckout);
//thêm hiển thị discount_amount
export default router;

