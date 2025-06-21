import cartService from "../services/cart.service.js";
import responseUtil from "../utils/response.util.js";
import logger from "../config/logger.config.js";

/**
 * Cart Controller - Xử lý các HTTP requests liên quan đến giỏ hàng
 */

// Lấy giỏ hàng của user hiện tại
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { include_saved = true } = req.query;

    logger.info(`[CART] GET /carts - User: ${userId}, include_saved: ${include_saved}`);

    const cart = await cartService.getCart(userId, include_saved === "true");

    return responseUtil.successResponse(res, cart, "Lấy giỏ hàng thành công");
  } catch (error) {
    logger.error(`[CART] GET /carts - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
    });
    return responseUtil.errorResponse(res, null, error.message, error.statusCode || 500);
  }
};

// Thêm sản phẩm vào giỏ hàng
const addItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { product_id, selected_variant, quantity } = req.body;

    logger.info(`[CART] POST /carts/items - User: ${userId}, Product: ${product_id}`);

    const cart = await cartService.addItem(userId, product_id, selected_variant, quantity);

    return responseUtil.createdResponse(res, cart, "Thêm sản phẩm vào giỏ hàng thành công");
  } catch (error) {
    logger.error(`[CART] POST /carts/items - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
      body: req.body,
    });

    // Xử lý các loại lỗi cụ thể
    if (error.message.includes("không tồn tại")) {
      return responseUtil.notFoundResponse(res, null, error.message);
    }
    if (error.message.includes("trong kho")) {
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

    logger.info(`[CART] PUT /carts/items - User: ${userId}, Product: ${product_id}, Quantity: ${quantity}`);

    const cart = await cartService.updateItemQuantity(userId, product_id, selected_variant, quantity);

    return responseUtil.successResponse(res, cart, "Cập nhật số lượng sản phẩm thành công");
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

    logger.info(`[CART] DELETE /carts/items - User: ${userId}, Product: ${product_id}`);

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
    const userId = req.user._id;
    const { coupon_code } = req.body;

    logger.info(`[CART] POST /carts/coupons - User: ${userId}, Coupon: ${coupon_code}`);

    const result = await cartService.applyCoupon(userId, coupon_code);

    return responseUtil.successResponse(res, result, "Áp dụng mã giảm giá thành công");
  } catch (error) {
    logger.error(`[CART] POST /carts/coupons - Error: ${error.message}`, {
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
const removeCoupon = async (req, res) => {
  try {
    const userId = req.user._id;

    logger.info(`[CART] DELETE /carts/coupons - User: ${userId}`);

    const cart = await cartService.removeCoupon(userId);

    return responseUtil.successResponse(res, cart, "Xóa mã giảm giá thành công");
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
const bulkUpdateItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const { items } = req.body;

    logger.info(`[CART] PUT /carts/bulk-update - User: ${userId}, Items: ${items.length}`);

    const cart = await cartService.bulkUpdateItems(userId, items);

    return responseUtil.successResponse(res, cart, "Cập nhật nhiều sản phẩm thành công");
  } catch (error) {
    logger.error(`[CART] PUT /carts/bulk-update - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
      body: req.body,
    });

    if (error.message.includes("trong kho")) {
      return responseUtil.badRequestResponse(res, null, error.message);
    }

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
  bulkUpdateItems,
  getCartSummary,
  syncCartPrices,
  validateCartForCheckout,
};
