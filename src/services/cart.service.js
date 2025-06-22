import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import couponService from "./coupon.service.js";
import logger from "../config/logger.config.js";

/**
 * Cart Service - Xử lý tất cả business logic liên quan đến giỏ hàng
 */

// Lấy hoặc tạo giỏ hàng cho user
const getOrCreateCart = async (userId) => {
  try {
    let cart = await Cart.findByUser(userId);

    if (!cart) {
      cart = await Cart.createForUser(userId);
      logger.info(`[CART] Tạo giỏ hàng mới cho user: ${userId}`);
    }

    return cart;
  } catch (error) {
    logger.error(`[CART] Lỗi khi lấy/tạo giỏ hàng cho user ${userId}: ${error.message}`);
    throw new Error("Không thể tải giỏ hàng");
  }
};

// Lấy giỏ hàng của user
const getCart = async (userId, includeSaved = true) => {
  try {
    const cart = await getOrCreateCart(userId);

    // Filter items based on includeSaved parameter
    if (!includeSaved) {
      cart.items = cart.items.filter((item) => !item.saved_for_later);
    }

    return cart;
  } catch (error) {
    logger.error(`[CART] Lỗi khi lấy giỏ hàng cho user ${userId}: ${error.message}`);
    throw error;
  }
};

// Validate product và variant tồn tại và có đủ stock
const validateProductAndVariant = async (productId, variant, requestedQuantity) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Sản phẩm không tồn tại");
  }

  // Tìm variant trong product
  const productVariant = product.variants.find((v) => v.color === variant.color && v.size === variant.size);

  if (!productVariant) {
    throw new Error(`Variant ${variant.color} - ${variant.size} không tồn tại cho sản phẩm này`);
  }

  // Kiểm tra stock
  if (productVariant.stock < requestedQuantity) {
    throw new Error(`Chỉ còn ${productVariant.stock} sản phẩm trong kho`);
  }

  // Tính giá hiện tại (ưu tiên sale_price nếu có)
  const currentPrice = product.sale_price ? parseFloat(product.sale_price.toString()) : parseFloat(product.original_price.toString());

  return {
    product,
    variant: {
      ...productVariant.toObject(),
      price: currentPrice,
    },
    currentPrice,
  };
};

// Thêm sản phẩm vào giỏ hàng
const addItem = async (userId, productId, variant, quantity) => {
  try {
    // Validate product và variant
    const { variant: validatedVariant, currentPrice } = await validateProductAndVariant(productId, variant, quantity);

    // Lấy giỏ hàng
    const cart = await getOrCreateCart(userId);

    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const existingItemIndex = cart.items.findIndex((item) => {
      // Handle cả populated object và string ID
      const itemProductId = item.product._id ? item.product._id.toString() : item.product.toString();
      const matchProduct = itemProductId === productId.toString();
      const matchVariant = item.selected_variant.color === variant.color && item.selected_variant.size === variant.size;
      const notSavedForLater = !item.saved_for_later;

      logger.info(`[CART] Comparing item - ProductID: ${itemProductId} vs ${productId}, Variant: ${item.selected_variant.color}-${item.selected_variant.size} vs ${variant.color}-${variant.size}, Match: ${matchProduct && matchVariant && notSavedForLater}`);

      return matchProduct && matchVariant && notSavedForLater;
    });

    logger.info(`[CART] Checking existing item - ProductID: ${productId}, Variant: ${variant.color}-${variant.size}, Found index: ${existingItemIndex}`);

    if (existingItemIndex > -1) {
      // Cập nhật số lượng nếu sản phẩm đã tồn tại
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      // Validate stock cho số lượng mới
      const { currentPrice: updatedPrice } = await validateProductAndVariant(productId, variant, newQuantity);

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].unit_price = updatedPrice;
      cart.items[existingItemIndex].total_price = newQuantity * updatedPrice;
      cart.items[existingItemIndex].updated_at = new Date();

      logger.info(`[CART] Updated existing item - New quantity: ${newQuantity}, Total price: ${newQuantity * updatedPrice}`);
    } else {
      // Thêm item mới
      cart.items.push({
        product: productId,
        selected_variant: validatedVariant,
        quantity: quantity,
        unit_price: currentPrice,
        total_price: quantity * currentPrice,
        saved_for_later: false,
        added_at: new Date(),
        updated_at: new Date(),
      });

      logger.info(`[CART] Added new item - Quantity: ${quantity}, Total price: ${quantity * currentPrice}`);
    }

    await cart.save();

    logger.info(`[CART] Thêm sản phẩm ${productId} vào giỏ hàng user ${userId}`);
    return cart;
  } catch (error) {
    logger.error(`[CART] Lỗi khi thêm sản phẩm vào giỏ hàng: ${error.message}`);
    throw error;
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
const updateItemQuantity = async (userId, productId, variant, newQuantity) => {
  try {
    const cart = await getOrCreateCart(userId);

    // Tìm item trong giỏ hàng
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId.toString() && item.selected_variant.color === variant.color && item.selected_variant.size === variant.size && !item.saved_for_later);

    if (itemIndex === -1) {
      throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
    }

    if (newQuantity === 0) {
      // Xóa item nếu quantity = 0
      cart.items.splice(itemIndex, 1);
    } else {
      // Validate stock cho số lượng mới và lấy giá hiện tại
      const { currentPrice } = await validateProductAndVariant(productId, variant, newQuantity);

      cart.items[itemIndex].quantity = newQuantity;
      cart.items[itemIndex].unit_price = currentPrice;
      cart.items[itemIndex].total_price = newQuantity * currentPrice;
      cart.items[itemIndex].updated_at = new Date();
    }

    await cart.save();

    logger.info(`[CART] Cập nhật số lượng sản phẩm ${productId} trong giỏ hàng user ${userId}`);
    return cart;
  } catch (error) {
    logger.error(`[CART] Lỗi khi cập nhật số lượng sản phẩm: ${error.message}`);
    throw error;
  }
};

// Xóa sản phẩm khỏi giỏ hàng
const removeItem = async (userId, productId, variant) => {
  try {
    const cart = await getOrCreateCart(userId);

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId.toString() && item.selected_variant.color === variant.color && item.selected_variant.size === variant.size);

    if (itemIndex === -1) {
      throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    logger.info(`[CART] Xóa sản phẩm ${productId} khỏi giỏ hàng user ${userId}`);
    return cart;
  } catch (error) {
    logger.error(`[CART] Lỗi khi xóa sản phẩm khỏi giỏ hàng: ${error.message}`);
    throw error;
  }
};

// Xóa toàn bộ giỏ hàng
const clearCart = async (userId) => {
  try {
    const cart = await getOrCreateCart(userId);

    cart.items = [];
    cart.applied_coupon = {};
    await cart.save();

    logger.info(`[CART] Xóa toàn bộ giỏ hàng user ${userId}`);
    return cart;
  } catch (error) {
    logger.error(`[CART] Lỗi khi xóa toàn bộ giỏ hàng: ${error.message}`);
    throw error;
  }
};

// Lưu sản phẩm để mua sau
const saveForLater = async (userId, productId, variant) => {
  try {
    const cart = await getOrCreateCart(userId);

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId.toString() && item.selected_variant.color === variant.color && item.selected_variant.size === variant.size && !item.saved_for_later);

    if (itemIndex === -1) {
      throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
    }

    cart.items[itemIndex].saved_for_later = true;
    cart.items[itemIndex].updated_at = new Date();
    await cart.save();

    logger.info(`[CART] Lưu sản phẩm ${productId} để mua sau cho user ${userId}`);
    return cart;
  } catch (error) {
    logger.error(`[CART] Lỗi khi lưu sản phẩm để mua sau: ${error.message}`);
    throw error;
  }
};

// Chuyển sản phẩm từ "save for later" về giỏ hàng
const moveToCart = async (userId, productId, variant) => {
  try {
    const cart = await getOrCreateCart(userId);

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId.toString() && item.selected_variant.color === variant.color && item.selected_variant.size === variant.size && item.saved_for_later);

    if (itemIndex === -1) {
      throw new Error("Sản phẩm không tồn tại trong danh sách lưu sau");
    }

    // Validate stock trước khi move về cart
    await validateProductAndVariant(productId, variant, cart.items[itemIndex].quantity);

    cart.items[itemIndex].saved_for_later = false;
    cart.items[itemIndex].updated_at = new Date();
    await cart.save();

    logger.info(`[CART] Chuyển sản phẩm ${productId} từ lưu sau về giỏ hàng cho user ${userId}`);
    return cart;
  } catch (error) {
    logger.error(`[CART] Lỗi khi chuyển sản phẩm về giỏ hàng: ${error.message}`);
    throw error;
  }
};

// Áp dụng mã giảm giá
const applyCoupon = async (userId, couponCode) => {
  try {
    const cart = await getOrCreateCart(userId);

    // Tính subtotal từ các items không phải "saved for later"
    const activeItems = cart.items.filter((item) => !item.saved_for_later);
    if (activeItems.length === 0) {
      throw new Error("Giỏ hàng trống, không thể áp dụng mã giảm giá");
    }

    const subtotal = activeItems.reduce((sum, item) => {
      return sum + parseFloat(item.total_price?.toString() || 0);
    }, 0);

    // Lấy danh sách product IDs để validate coupon
    const productIds = activeItems.map((item) => item.product.toString());

    // Validate coupon qua coupon service
    const couponValidation = await couponService.validateCoupon(couponCode, userId, subtotal, productIds);

    if (!couponValidation.isValid) {
      throw new Error("Mã giảm giá không hợp lệ");
    }

    // Áp dụng coupon vào cart
    cart.applied_coupon = {
      code: couponCode.toUpperCase(),
      discount_amount: couponValidation.discountAmount,
      discount_type: couponValidation.coupon.discountType === "percentage" ? "percentage" : "fixed",
    };

    await cart.save();

    logger.info(`[CART] Áp dụng mã giảm giá ${couponCode} cho user ${userId}`);
    return {
      cart,
      couponInfo: couponValidation,
    };
  } catch (error) {
    logger.error(`[CART] Lỗi khi áp dụng mã giảm giá: ${error.message}`);
    throw error;
  }
};

// Xóa mã giảm giá
const removeCoupon = async (userId) => {
  try {
    const cart = await getOrCreateCart(userId);

    cart.applied_coupon = {};
    await cart.save();

    logger.info(`[CART] Xóa mã giảm giá cho user ${userId}`);
    return cart;
  } catch (error) {
    logger.error(`[CART] Lỗi khi xóa mã giảm giá: ${error.message}`);
    throw error;
  }
};

// Bulk update nhiều items cùng lúc
const bulkUpdateItems = async (userId, updates) => {
  try {
    const cart = await getOrCreateCart(userId);

    // Validate tất cả updates trước khi apply
    for (const update of updates) {
      if (update.quantity > 0) {
        await validateProductAndVariant(update.product_id, update.selected_variant, update.quantity);
      }
    }

    // Apply updates
    for (const update of updates) {
      const itemIndex = cart.items.findIndex((item) => item.product.toString() === update.product_id.toString() && item.selected_variant.color === update.selected_variant.color && item.selected_variant.size === update.selected_variant.size && !item.saved_for_later);

      if (itemIndex > -1) {
        if (update.quantity === 0) {
          cart.items.splice(itemIndex, 1);
        } else {
          const { currentPrice } = await validateProductAndVariant(update.product_id, update.selected_variant, 1);
          cart.items[itemIndex].quantity = update.quantity;
          cart.items[itemIndex].unit_price = currentPrice;
          cart.items[itemIndex].total_price = update.quantity * currentPrice;
          cart.items[itemIndex].updated_at = new Date();
        }
      }
    }

    await cart.save();

    logger.info(`[CART] Bulk update ${updates.length} items cho user ${userId}`);
    return cart;
  } catch (error) {
    logger.error(`[CART] Lỗi khi bulk update items: ${error.message}`);
    throw error;
  }
};

// Sync giá của tất cả items trong cart với giá hiện tại
const syncCartPrices = async (userId) => {
  try {
    const cart = await getOrCreateCart(userId);

    for (const item of cart.items) {
      try {
        const { currentPrice } = await validateProductAndVariant(item.product, item.selected_variant, 1);

        // Cập nhật giá nếu khác với giá hiện tại
        if (parseFloat(item.unit_price.toString()) !== currentPrice) {
          item.unit_price = currentPrice;
          item.total_price = item.quantity * currentPrice;
          item.updated_at = new Date();
        }
      } catch (error) {
        // Log warning nếu sản phẩm không còn tồn tại hoặc variant không hợp lệ
        logger.warn(`[CART] Không thể sync giá cho item ${item.product}: ${error.message}`);
      }
    }

    await cart.save();

    logger.info(`[CART] Sync giá cart cho user ${userId}`);
    return cart;
  } catch (error) {
    logger.error(`[CART] Lỗi khi sync giá cart: ${error.message}`);
    throw error;
  }
};

// Lấy cart summary (thống kê)
const getCartSummary = async (userId) => {
  try {
    const cart = await getOrCreateCart(userId);

    const activeItems = cart.items.filter((item) => !item.saved_for_later);
    const savedItems = cart.items.filter((item) => item.saved_for_later);

    const summary = {
      total_items: activeItems.length,
      total_quantity: activeItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: parseFloat(cart.subtotal?.toString() || 0),
      discount_amount: parseFloat(cart.applied_coupon?.discount_amount?.toString() || 0),
      total: parseFloat(cart.total?.toString() || 0),
      saved_items_count: savedItems.length,
      applied_coupon: cart.applied_coupon?.code || null,
      last_updated: cart.updated_at,
    };

    return summary;
  } catch (error) {
    logger.error(`[CART] Lỗi khi lấy cart summary: ${error.message}`);
    throw error;
  }
};

// Validate toàn bộ cart trước khi checkout
const validateCartForCheckout = async (userId) => {
  try {
    const cart = await getOrCreateCart(userId);

    const activeItems = cart.items.filter((item) => !item.saved_for_later);

    if (activeItems.length === 0) {
      throw new Error("Giỏ hàng trống");
    }

    const validationErrors = [];

    // Validate từng item
    for (const item of activeItems) {
      try {
        await validateProductAndVariant(item.product, item.selected_variant, item.quantity);
      } catch (error) {
        validationErrors.push({
          product_id: item.product,
          variant: item.selected_variant,
          error: error.message,
        });
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(`Có ${validationErrors.length} sản phẩm không hợp lệ trong giỏ hàng`);
    }

    // Validate coupon nếu có
    if (cart.applied_coupon?.code) {
      const subtotal = activeItems.reduce((sum, item) => {
        return sum + parseFloat(item.total_price?.toString() || 0);
      }, 0);

      const productIds = activeItems.map((item) => item.product.toString());

      try {
        await couponService.validateCoupon(cart.applied_coupon.code, userId, subtotal, productIds);
      } catch (error) {
        logger.warn(`[CART] Coupon validation failed: ${error.message}`);
        // Xóa coupon không hợp lệ
        const invalidCouponCode = cart.applied_coupon.code;
        cart.applied_coupon = {};
        await cart.save();
        logger.warn(`[CART] Xóa coupon không hợp lệ ${invalidCouponCode} cho user ${userId}`);
      }
    }

    return {
      isValid: true,
      cart,
      errors: validationErrors,
    };
  } catch (error) {
    logger.error(`[CART] Lỗi khi validate cart cho checkout: ${error.message}`);
    return {
      isValid: false,
      cart: null,
      errors: [{ error: error.message }],
    };
  }
};

export default {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  saveForLater,
  moveToCart,
  applyCoupon,
  removeCoupon,
  bulkUpdateItems,
  syncCartPrices,
  getCartSummary,
  validateCartForCheckout,
  getOrCreateCart,
  validateProductAndVariant,
};
