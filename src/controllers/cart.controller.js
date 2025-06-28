import cartService from "../services/cart.service.js";
import responseUtil from "../utils/response.util.js";
import logger from "../config/logger.config.js";
import couponService from "../services/coupon.service.js";
// import { bulkUpdateItems } from '../services/cart.service.js';
/**
 * Cart Controller - Xử lý các HTTP requests liên quan đến giỏ hàng
 */
const getCart = async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || !req.user._id) {
      return responseUtil.unauthorizedResponse(res, null, "User not authenticated");
    }

    const userId = req.user._id;
    const { include_saved = true, page = 1, limit = 100, coupon_code } = req.query;

    // Validate query parameters
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const validLimit = Math.min(Math.max(1, parseInt(limit, 10) || 100), 100);

    logger.info(`[CART] GET /carts - User: ${userId}, include_saved: ${include_saved}, page: ${validPage}, limit: ${validLimit}`);

    const cartData = await cartService.getCart(userId, include_saved === "true" || include_saved === true, validPage, validLimit);

    // Handle coupon validation if provided
    if (coupon_code && typeof coupon_code === "string" && coupon_code.trim()) {
      try {
        const couponResult = await couponService.validateCoupon(coupon_code.trim(), userId, cartData.subtotal, cartData.items.map((i) => i.product?._id).filter(Boolean));

        cartData.applied_coupon = couponResult.coupon;
        cartData.discountAmount = couponResult.discountAmount;
        cartData.finalTotal = couponResult.finalAmount;

        await cartService.saveCartCoupon(userId, couponResult.coupon, couponResult.discountAmount, couponResult.finalAmount);
      } catch (couponErr) {
        logger.warn(`[CART] Invalid coupon: ${couponErr.message}`);
        cartData.applied_coupon_error = couponErr.message;
      }
    }

    return responseUtil.successResponse(res, cartData, "Lấy giỏ hàng thành công");
  } catch (error) {
    logger.error(`[CART] GET /carts - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
    });
    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};

// Thêm sản phẩm vào giỏ hàng
const MAX_QUANTITY_PER_ITEM = 10;

export const addItem = async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || !req.user._id) {
      return responseUtil.unauthorizedResponse(res, null, "User not authenticated");
    }

    const userId = req.user._id;
    const { product_id, selected_variant, quantity } = req.body;

    // Validate required fields
    if (!product_id) {
      return responseUtil.badRequestResponse(res, null, "Thiếu product_id");
    }

    if (!selected_variant) {
      return responseUtil.badRequestResponse(res, null, "Thiếu thông tin biến thể sản phẩm");
    }

    if (!selected_variant.color || !selected_variant.size) {
      return responseUtil.badRequestResponse(res, null, "Thiếu thông tin màu sắc hoặc kích cỡ");
    }

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return responseUtil.badRequestResponse(res, null, "Số lượng phải là số nguyên dương");
    }

    if (quantity > MAX_QUANTITY_PER_ITEM) {
      return responseUtil.badRequestResponse(res, null, `Bạn chỉ có thể mua tối đa ${MAX_QUANTITY_PER_ITEM} sản phẩm mỗi loại`);
    }

    // Validate color format
    if (typeof selected_variant.color === "string") {
      return responseUtil.badRequestResponse(res, null, "Màu sắc phải là object với name và hex");
    }

    if (!selected_variant.color.name) {
      return responseUtil.badRequestResponse(res, null, "Thiếu tên màu sắc");
    }

    logger.info(`[CART] POST /carts/items - User: ${userId}, Product: ${product_id}, Variant: ${selected_variant.color.name}-${selected_variant.size}, Quantity: ${quantity}`);

    // Call service to add item
    await cartService.addItem(userId, product_id, selected_variant, quantity);

    // Return updated cart
    const updatedCart = await cartService.getCart(userId, true);

    return responseUtil.createdResponse(res, updatedCart, "Thêm sản phẩm vào giỏ hàng thành công");
  } catch (error) {
    logger.error(`[CART] POST /carts/items - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
      body: req.body,
    });

    // Handle specific error types
    if (error.message.includes("không tồn tại") || error.message.includes("not found")) {
      return responseUtil.notFoundResponse(res, null, error.message);
    }

    if (error.message.includes("trong kho") || error.message.includes("stock") || error.message.includes("tối đa")) {
      return responseUtil.badRequestResponse(res, null, error.message);
    }

    if (error.message.includes("Missing required") || error.message.includes("Thiếu")) {
      return responseUtil.badRequestResponse(res, null, error.message);
    }

    if (error.message.includes("tối đa")) {
      return responseUtil.badRequestResponse(res, null, error.message);
    }

    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};
// Cập nhật số lượng sản phẩm trong giỏ hàng
const updateItemQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { product_id, selected_variant, quantity } = req.body;

    logger.info(`[CART] PUT /carts/items - User: ${userId}, Product: ${product_id}, Variant: ${JSON.stringify(selected_variant)}, Quantity: ${quantity}`);

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity < 0) {
      return responseUtil.badRequestResponse(res, null, "Số lượng phải là số nguyên không âm");
    }

    const cart = await cartService.updateItemQuantity(userId, product_id, selected_variant, quantity);

    return responseUtil.successResponse(res, cart, quantity === 0 ? "Xóa sản phẩm khỏi giỏ hàng thành công" : "Cập nhật số lượng sản phẩm thành công");
  } catch (error) {
    logger.error(`[CART] PUT /carts/items - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
      body: req.body,
    });

    if (error.message.includes("không tồn tại")) {
      return responseUtil.notFoundResponse(res, null, error.message);
    }
    if (error.message.includes("trong kho")) {
      return responseUtil.badRequestResponse(res, null, error.message);
    }

    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};

// Xóa sản phẩm khỏi giỏ hàng
const removeItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { product_id, selected_variant } = req.body;

    logger.info(`[CART] DELETE /carts/items - User: ${userId}, Product: ${product_id}, Variant: ${selected_variant?.color?.name || selected_variant?.color}-${selected_variant?.size}`);

    const cart = await cartService.removeItem(userId, product_id, selected_variant);

    return responseUtil.successResponse(res, cart, "Xóa sản phẩm khỏi giỏ hàng thành công");
  } catch (error) {
    logger.error(`[CART] DELETE /carts/items - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
      body: req.body,
    });

    if (error.message.includes("không tồn tại")) {
      return responseUtil.notFoundResponse(res, null, error.message);
    }

    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};

// Xóa toàn bộ giỏ hàng
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    logger.info(`[CART] DELETE /carts - User: ${userId}`);

    const cart = await cartService.clearCart(userId);

    return responseUtil.successResponse(res, cart, "Xóa toàn bộ giỏ hàng thành công");
  } catch (error) {
    logger.error(`[CART] DELETE /carts - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
    });

    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};

// Áp dụng mã giảm giá
const applyCoupon = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { coupon_code } = req.body;

    logger.info(`[CART] POST /carts/coupons - User: ${userId}, Coupon: ${coupon_code}`);

    // Lấy giỏ hàng để tính subtotal + productIds
    const cart = await cartService.getOrCreateCart(userId);
    const activeItems = cart.items.filter((item) => !item.saved_for_later);

    const subtotal = activeItems.reduce((sum, item) => sum + parseFloat(item.total_price?.toString() || 0), 0);

    const productIds = activeItems.map((item) => item.product.toString());

    const result = await couponService.applyCoupon(coupon_code, userId, subtotal, productIds);

    return responseUtil.successResponse(res, result, "Áp dụng mã giảm giá thành công");
  } catch (error) {
    logger.error(error.message, {
      stack: error.stack,
      userId: req.user?._id,
      body: req.body,
    });

    if (error.message.includes("không tồn tại") || error.message.includes("không hợp lệ") || error.message.includes("hết hạn") || error.message.includes("hết lượt")) {
      return responseUtil.badRequestResponse(res, null, error.message);
    }

    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};

// Xóa mã giảm giá
// Xóa mã giảm giá
const removeCoupon = async (req, res) => {
  try {
    const userId = req.user._id;

    logger.info(`[CART] DELETE /carts/coupons - User: ${userId}`);

    const cart = await cartService.removeCoupon(userId);

    return responseUtil.successResponse(res, cart, "Mã giảm giá đã được xóa (nếu có)");
  } catch (error) {
    logger.error(`[CART] DELETE /carts/coupons - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
    });

    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};

// Lưu sản phẩm để mua sau
const saveForLater = async (req, res) => {
  try {
    const userId = req.user._id;
    const { product_id, selected_variant } = req.body;

    logger.info(`[CART] POST /carts/items/save-later - User: ${userId}, Product: ${product_id}`);

    const cart = await cartService.saveForLater(userId, product_id, selected_variant);

    return responseUtil.successResponse(res, cart, "Lưu sản phẩm để mua sau thành công");
  } catch (error) {
    logger.error(`[CART] POST /carts/items/save-later - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
      body: req.body,
    });

    if (error.message.includes("không tồn tại")) {
      return responseUtil.notFoundResponse(res, null, error.message);
    }

    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};

// Chuyển sản phẩm từ "save for later" về giỏ hàng
const moveToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { product_id, selected_variant } = req.body;

    logger.info(`[CART] POST /carts/items/move-to-cart - User: ${userId}, Product: ${product_id}`);

    const cart = await cartService.moveToCart(userId, product_id, selected_variant);

    return responseUtil.successResponse(res, cart, "Chuyển sản phẩm về giỏ hàng thành công");
  } catch (error) {
    logger.error(`[CART] POST /carts/items/move-to-cart - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
      body: req.body,
    });

    if (error.message.includes("không tồn tại")) {
      return responseUtil.notFoundResponse(res, null, error.message);
    }
    if (error.message.includes("trong kho")) {
      return responseUtil.badRequestResponse(res, null, error.message);
    }

    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};

// Bulk update nhiều items
// Bulk update nhiều items
const bulkUpdateItemsController = async (req, res) => {
  try {
    const userId = req.user._id?.toString();

    logger.info("[BULK UPDATE] Bắt đầu xử lý bulk update...");
    logger.info("[BULK UPDATE] req.body =", JSON.stringify(req.body));

    const updates = req.body?.updates || req.body?.items;

    if (!Array.isArray(updates)) {
      logger.warn("[BULK UPDATE] Không tìm thấy mảng updates hoặc items trong payload");
      return responseUtil.badRequestResponse(res, null, "Dữ liệu bulk update không hợp lệ. 'items' hoặc 'updates' phải là array.");
    }

    logger.info("[BULK UPDATE] Số lượng items:", updates.length);
    logger.info("[BULK UPDATE] Dữ liệu updates:", JSON.stringify(updates, null, 2));

    const result = await cartService.bulkUpdateItems(userId, updates);

    return responseUtil.successResponse(res, result, "Bulk update giỏ hàng thành công");
  } catch (error) {
    logger.error(`[CART] Bulk update error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
      body: req.body,
    });

    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};

// Lấy tóm tắt giỏ hàng
const getCartSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    logger.info(`[CART] GET /carts/summary - User: ${userId}`);

    const summary = await cartService.getCartSummary(userId);

    return responseUtil.successResponse(res, summary, "Lấy tóm tắt giỏ hàng thành công");
  } catch (error) {
    logger.error(`[CART] GET /carts/summary - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
    });

    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};

// Sync giá của tất cả items trong cart
const syncCartPrices = async (req, res) => {
  try {
    const userId = req.user._id;

    logger.info(`[CART] POST /carts/sync-prices - User: ${userId}`);

    const cart = await cartService.syncCartPrices(userId);

    return responseUtil.successResponse(res, cart, "Đồng bộ giá giỏ hàng thành công");
  } catch (error) {
    logger.error(`[CART] POST /carts/sync-prices - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
    });

    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};

// Validate giỏ hàng trước khi checkout
const validateCartForCheckout = async (req, res) => {
  try {
    const userId = req.user._id;

    logger.info(`[CART] POST /carts/validate - User: ${userId}`);

    const validation = await cartService.validateCartForCheckout(userId);

    if (validation.isValid) {
      return responseUtil.successResponse(res, validation, "Giỏ hàng hợp lệ để thanh toán");
    } else {
      return responseUtil.badRequestResponse(res, validation, "Giỏ hàng có lỗi, vui lòng kiểm tra lại");
    }
  } catch (error) {
    logger.error(`[CART] POST /carts/validate - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
    });

    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};

export default {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  saveForLater,
  moveToCart,
  bulkUpdateItemsController,
  getCartSummary,
  syncCartPrices,
  validateCartForCheckout,
};
