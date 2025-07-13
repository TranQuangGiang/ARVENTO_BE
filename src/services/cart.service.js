/**
 * Cart Service - Xử lý tất cả business logic liên quan đến giỏ hàng
 */
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import Variant from "../models/variant.model.js";
import logger from "../config/logger.config.js";
import couponService from "./coupon.service.js";
// Lấy hoặc tạo giỏ hàng cho user
const getOrCreateCart = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    let cart = await Cart.findByUser(userId);
    if (!cart) {
      cart = await Cart.createForUser(userId);
      logger.info(`[CART] Created new cart for user: ${userId}`);
    }
    return cart;
  } catch (error) {
    logger.error(`[CART] Error getting or creating cart for user ${userId}: ${error.message}`);
    throw error;
  }
};

const saveCartCoupon = async (userId, couponData, discountAmount, finalTotal) => {
  try {
    if (!userId || !couponData || discountAmount === undefined || finalTotal === undefined) {
      throw new Error("Missing required parameters for saveCartCoupon");
    }

    const cart = await getOrCreateCart(userId);

    cart.applied_coupon = {
      code: couponData.code,
      discount_amount: discountAmount,
      discount_type: couponData.discountType,
    };

    cart.final_total = finalTotal;

    await cart.save();
    logger.info(`[CART] Applied coupon ${couponData.code} to cart for user: ${userId}`);
  } catch (error) {
    logger.error(`[CART] Error saving coupon for user ${userId}: ${error.message}`);
    throw error;
  }
};

// Lấy giỏ hàng của user
export const getCart = async (userId, includeSaved = true, page = 1, limit = 100) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Validate pagination parameters
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(Math.max(1, parseInt(limit) || 100), 100);

    let cart = await Cart.findByUser(userId);
    if (!cart) {
      cart = await Cart.createForUser(userId);
      logger.info(`[CART] Created new cart for user: ${userId}`);
    }

    await cart.populate("items.product");

    const cartObj = cart.toObject();

    let items = includeSaved ? cartObj.items : cartObj.items.filter((item) => !item.saved_for_later);

    // Áp dụng phân trang
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / validLimit) || 1;
    const startIndex = (validPage - 1) * validLimit;
    const paginatedItems = items.slice(startIndex, startIndex + validLimit);

    const transformedItems = paginatedItems
      .map((item) => {
        // Validate item structure
        if (!item.product) {
          logger.warn(`[CART] Item without product found in cart for user: ${userId}`);
          return null;
        }

        return {
          product: {
            _id: item.product._id,
            name: item.product.name,
            slug: item.product.slug,
            images: item.product.images || [],
            original_price: parseFloat(item.product.original_price?.toString() || "0"),
            sale_price: parseFloat(item.product.sale_price?.toString() || "0"),
            isActive: item.product.isActive,
          },
          selected_variant: item.selected_variant
            ? {
                color: typeof item.selected_variant.color === "object" ? item.selected_variant.color : { name: item.selected_variant.color, hex: null },
                size: item.selected_variant.size,
                sku: item.selected_variant.sku,
                price: parseFloat(item.selected_variant.price?.toString() || "0"),
                stock: item.selected_variant.stock || 0,
                image: item.selected_variant.image || { url: "", alt: "" },
              }
            : null,
          quantity: item.quantity || 0,
          unit_price: parseFloat(item.unit_price?.toString() || "0"),
          total_price: parseFloat(item.total_price?.toString() || "0"),
          saved_for_later: Boolean(item.saved_for_later),
          added_at: item.added_at,
          updated_at: item.updated_at,
        };
      })
      .filter(Boolean); // Remove null items

    return {
      _id: cartObj._id,
      user: cartObj.user,
      items: transformedItems,
      pagination: {
        totalItems,
        totalPages,
        page: validPage,
        limit: validLimit,
      },
      items_count: cartObj.items_count || 0,
      saved_items_count: cartObj.saved_items_count || 0,
      total_quantity: cartObj.total_quantity || 0,
      subtotal: parseFloat(cartObj.subtotal?.toString() || "0"),
      total: parseFloat(cartObj.total?.toString() || "0"),
      applied_coupon: cartObj.applied_coupon?.code
        ? {
            code: cartObj.applied_coupon.code,
            discount_amount: parseFloat(cartObj.applied_coupon?.discount_amount?.toString() || "0"),
            discount_type: cartObj.applied_coupon?.discount_type || "percentage",
          }
        : null,
      final_total: parseFloat(cartObj.final_total?.toString() || cartObj.total?.toString() || "0"),
      created_at: cartObj.created_at,
      updated_at: cartObj.updated_at,
    };
  } catch (error) {
    logger.error(`[CART] Error getting cart for user ${userId}: ${error.message}`);
    throw error;
  }
};

// Validate product và variant tồn tại và có đủ stock
const validateProductAndVariant = async (productId, variantData, requestedQuantity) => {
  try {
    // Validate inputs
    if (!productId) {
      throw new Error("Product ID is required");
    }

    if (!variantData) {
      throw new Error("Thiếu thông tin biến thể sản phẩm (selected_variant)");
    }

    if (!variantData.color || !variantData.color.name) {
      throw new Error("Thiếu thông tin màu sắc trong selected_variant");
    }

    if (!variantData.size) {
      throw new Error("Thiếu thông tin kích cỡ trong selected_variant");
    }

    if (requestedQuantity <= 0) {
      throw new Error("Số lượng phải lớn hơn 0");
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Sản phẩm không tồn tại");
    }

    if (!product.isActive) {
      throw new Error("Sản phẩm hiện không khả dụng");
    }

    // Find exact variant in database
    const dbVariant = await Variant.findOne({
      product_id: productId,
      "color.name": variantData.color.name,
      size: variantData.size,
    });

    if (!dbVariant) {
      throw new Error(`Variant ${variantData.color.name} - ${variantData.size} không tồn tại cho sản phẩm này`);
    }

    if (dbVariant.stock < requestedQuantity) {
      throw new Error(`Chỉ còn ${dbVariant.stock} sản phẩm trong kho cho variant ${variantData.color.name} - ${variantData.size}`);
    }

    // Use variant price if available, otherwise use product price
    let currentPrice = 0;
    if (dbVariant.price && parseFloat(dbVariant.price.toString()) > 0) {
      currentPrice = parseFloat(dbVariant.price.toString());
    } else {
      const salePrice = parseFloat(product.sale_price?.toString() || "0");
      const originalPrice = parseFloat(product.original_price?.toString() || "0");
      currentPrice = salePrice > 0 ? salePrice : originalPrice;
    }

    if (currentPrice <= 0) {
      throw new Error("Giá sản phẩm không hợp lệ");
    }

    logger.info(`[CART] Validated variant: ${dbVariant.sku}, Price: ${currentPrice}, Stock: ${dbVariant.stock}`);

    return {
      product,
      variant: dbVariant.toObject(),
      currentPrice,
    };
  } catch (error) {
    logger.error(`[CART] Validation error for product ${productId}: ${error.message}`);
    throw error;
  }
};

// Thêm sản phẩm vào giỏ hàng
const MAX_QUANTITY_PER_ITEM = 10;

export const addItem = async (userId, productId, variant, quantity) => {
  try {
    // Validate inputs
    if (!userId || !productId || !variant || !quantity) {
      throw new Error("Missing required parameters for addItem");
    }

    logger.info(`[CART] Adding item to cart - User: ${userId}, Product: ${productId}, Quantity: ${quantity}`);

    const { variant: dbVariant, currentPrice } = await validateProductAndVariant(productId, variant, quantity);

    const cart = await getOrCreateCart(userId);

    // Find existing item with same product and exact variant match
    const existingItemIndex = cart.items.findIndex((item) => {
      const itemProductId = item.product?._id?.toString() || item.product?.toString();
      const matchProduct = itemProductId === productId.toString();
      const matchColor = item.selected_variant?.color?.name === variant.color.name;
      const matchSize = item.selected_variant?.size === variant.size;
      const notSavedForLater = !item.saved_for_later;

      return matchProduct && matchColor && matchSize && notSavedForLater;
    });

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      if (newQuantity > MAX_QUANTITY_PER_ITEM) {
        throw new Error(`Bạn chỉ có thể mua tối đa ${MAX_QUANTITY_PER_ITEM} sản phẩm mỗi loại.`);
      }

      // Re-validate with new quantity
      await validateProductAndVariant(productId, variant, newQuantity);

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].unit_price = currentPrice;
      cart.items[existingItemIndex].total_price = newQuantity * currentPrice;
      cart.items[existingItemIndex].updated_at = new Date();

      // Update variant info from database
      cart.items[existingItemIndex].selected_variant = {
        color: dbVariant.color,
        size: dbVariant.size,
        sku: dbVariant.sku,
        price: dbVariant.price,
        stock: dbVariant.stock,
        image: dbVariant.image,
      };

      logger.info(`[CART] Updated existing item ${dbVariant.sku} to quantity ${newQuantity}`);
    } else {
      if (quantity > MAX_QUANTITY_PER_ITEM) {
        throw new Error(`Bạn chỉ có thể mua tối đa ${MAX_QUANTITY_PER_ITEM} sản phẩm mỗi loại.`);
      }

      // Add new item with complete variant data from database
      cart.items.push({
        product: productId,
        selected_variant: {
          color: dbVariant.color,
          size: dbVariant.size,
          sku: dbVariant.sku,
          price: dbVariant.price,
          stock: dbVariant.stock,
          image: dbVariant.image,
        },
        quantity,
        unit_price: currentPrice,
        total_price: quantity * currentPrice,
        saved_for_later: false,
        added_at: new Date(),
        updated_at: new Date(),
      });

      logger.info(`[CART] Added new item ${dbVariant.sku} x ${quantity}`);
    }

    // Clear applied coupon when cart changes
    if (cart.applied_coupon?.code) {
      logger.info(`[CART] Clearing coupon ${cart.applied_coupon.code} after cart change`);
      cart.applied_coupon = {};
      cart.final_total = 0;
    }

    await cart.save();

    logger.info(`[CART] Cart saved successfully for user ${userId}`);
    return cart;
  } catch (error) {
    logger.error(`[CART] Error adding item to cart for user ${userId}: ${error.message}`);
    throw error;
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
const updateItemQuantity = async (userId, productId, variant, newQuantity) => {
  try {
    // Validate inputs
    if (!userId || !productId || !variant || newQuantity === undefined || newQuantity === null) {
      throw new Error("Missing required parameters for updateItemQuantity");
    }

    if (newQuantity < 0) {
      throw new Error("Số lượng không được âm");
    }

    if (newQuantity > MAX_QUANTITY_PER_ITEM) {
      throw new Error(`Số lượng không được vượt quá ${MAX_QUANTITY_PER_ITEM}`);
    }

    logger.info(`[CART] Updating item quantity - User: ${userId}, Product: ${productId}, New Quantity: ${newQuantity}`);

    const cart = await getOrCreateCart(userId);

    const itemIndex = cart.items.findIndex((item) => {
      const dbProductId = item.product && item.product._id ? item.product._id.toString() : item.product?.toString();
      const matchProduct = dbProductId === productId.toString();
      const matchColor = item.selected_variant?.color?.name === variant.color.name;
      const matchSize = item.selected_variant?.size === variant.size;
      const notSavedForLater = !item.saved_for_later;

      return matchProduct && matchColor && matchSize && notSavedForLater;
    });

    if (itemIndex === -1) {
      throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
    }

    if (newQuantity === 0) {
      cart.items.splice(itemIndex, 1);
      logger.info(`[CART] Removed item ${productId} - ${variant.color.name}-${variant.size} from cart for user ${userId}`);
    } else {
      // Validate stock availability
      const { currentPrice } = await validateProductAndVariant(productId, variant, newQuantity);

      cart.items[itemIndex].quantity = newQuantity;
      cart.items[itemIndex].unit_price = currentPrice;
      cart.items[itemIndex].total_price = newQuantity * currentPrice;
      cart.items[itemIndex].updated_at = new Date();

      logger.info(`[CART] Updated item ${productId} - ${variant.color.name}-${variant.size} quantity to ${newQuantity} for user ${userId}`);
    }

    // Clear applied coupon when cart changes
    if (cart.applied_coupon?.code) {
      logger.info(`[CART] Clearing coupon ${cart.applied_coupon.code} after quantity update`);
      cart.applied_coupon = {};
      cart.final_total = 0;
    }

    await cart.save();
    return cart;
  } catch (error) {
    logger.error(`[CART] Error updating item quantity for user ${userId}: ${error.message}`);
    throw error;
  }
};

// Xóa sản phẩm khỏi giỏ hàng
const removeItem = async (userId, productId, variant) => {
  try {
    // Validate inputs
    if (!userId || !productId || !variant) {
      throw new Error("Missing required parameters for removeItem");
    }

    logger.info(`[CART] Removing item from cart - User: ${userId}, Product: ${productId}`);

    const cart = await getOrCreateCart(userId);

    const itemIndex = cart.items.findIndex((item) => {
      let itemProductId;
      if (typeof item.product === "object" && item.product !== null) {
        itemProductId = item.product._id?.toString();
      } else {
        itemProductId = item.product?.toString();
      }

      const matchProduct = itemProductId === productId.toString();
      const matchColor = item.selected_variant?.color?.name === variant.color.name;
      const matchSize = item.selected_variant?.size === variant.size;

      return matchProduct && matchColor && matchSize;
    });

    if (itemIndex === -1) {
      throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
    }

    cart.items.splice(itemIndex, 1);

    // Clear applied coupon when cart changes
    if (cart.applied_coupon?.code) {
      logger.info(`[CART] Clearing coupon ${cart.applied_coupon.code} after item removal`);
      cart.applied_coupon = {};
      cart.final_total = 0;
    }

    await cart.save();

    logger.info(`[CART] Removed item ${productId} ${variant.size} from cart for user ${userId}`);

    return cart;
  } catch (error) {
    logger.error(`[CART] Error removing item from cart for user ${userId}: ${error.message}`);
    throw error;
  }
};

// Xóa toàn bộ giỏ hàng
const clearCart = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    logger.info(`[CART] Clearing cart for user: ${userId}`);

    const cart = await getOrCreateCart(userId);

    cart.items = [];
    cart.applied_coupon = {};
    cart.final_total = 0;

    await cart.save();

    logger.info(`[CART] Cart cleared successfully for user ${userId}`);
    return cart;
  } catch (error) {
    logger.error(`[CART] Error clearing cart for user ${userId}: ${error.message}`);
    throw error;
  }
};

// Lưu sản phẩm để mua sau
const saveForLater = async (userId, productId, variant) => {
  try {
    const cart = await getOrCreateCart(userId);

    console.log("============= DEBUG =============");
    console.log("productId payload:", productId);
    console.log("variant payload:", variant);

    cart.items.forEach((item, idx) => {
      console.log(`- ITEM ${idx}:`);
      console.log("  productId:", item.product?._id?.toString() || item.product?.toString());
      console.log("  color:", JSON.stringify(item.selected_variant?.color));
      console.log("  size:", item.selected_variant?.size);
      console.log("  saved_for_later:", item.saved_for_later);
    });
    console.log("============= END DEBUG =============");

    const itemIndex = cart.items.findIndex((item) => {
      const itemProductId = item.product?._id?.toString() || item.product?.toString();

      const itemColor = typeof item.selected_variant?.color === "object" ? item.selected_variant?.color?.name : item.selected_variant?.color;

      const itemSize = item.selected_variant?.size?.toString();

      const match = itemProductId === productId.toString() && itemColor === variant.color && itemSize === variant.size?.toString() && !item.saved_for_later;

      if (match) {
        console.log("==> MATCH FOUND WITH ITEM:");
        console.log("item.productId:", itemProductId);
        console.log("item.color:", itemColor);
        console.log("item.size:", itemSize);
      }

      return match;
    });

    console.log("Matched itemIndex:", itemIndex);

    if (itemIndex === -1) {
      throw new Error("Sản phẩm không tồn tại trong giỏ hàng hoặc đã được lưu để mua sau.");
    }

    cart.items[itemIndex].saved_for_later = true;
    cart.items[itemIndex].updated_at = new Date();

    cart.subtotal = cart.items.filter((item) => !item.saved_for_later).reduce((sum, item) => sum + item.total_price, 0);
    cart.total = cart.subtotal;

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

    logger.info(`[CART] moveToCart - Cart items: ${JSON.stringify(cart.items, null, 2)}`);
    logger.info(`[CART] Tìm productId: ${productId}, variant: ${JSON.stringify(variant)}`);

    const itemIndex = cart.items.findIndex((item) => {
      const itemColor = typeof item.selected_variant?.color === "object" ? item.selected_variant.color?.name : item.selected_variant?.color;

      logger.info(`[CART] So sánh:
    productId=${item.product?._id?.toString()} vs ${productId.toString()}
    color=${itemColor} vs ${variant.color}
    size=${item.selected_variant?.size} vs ${variant.size}
    saved_for_later=${item.saved_for_later}`);

      return item.product?._id?.toString() === productId.toString() && itemColor === variant.color && item.selected_variant?.size === variant.size && item.saved_for_later;
    });
    if (itemIndex === -1) {
      throw new Error("Sản phẩm không tồn tại trong danh sách lưu sau");
    }

    if (!cart.items[itemIndex].saved_for_later) {
      logger.info(`[CART] Sản phẩm ${productId} đã ở trong giỏ hàng của user ${userId}`);
      return cart;
    }

    logger.info(`[CART] Gọi validateProductAndVariant`);
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
  const cart = await getOrCreateCart(userId);

  const activeItems = cart.items.filter((item) => !item.saved_for_later);
  if (activeItems.length === 0) {
    throw new Error("Giỏ hàng trống, không thể áp dụng mã giảm giá");
  }

  const subtotal = activeItems.reduce((sum, item) => {
    return sum + parseFloat(item.total_price?.toString() || 0);
  }, 0);

  const productIds = activeItems.map((item) => item.product.toString());

  const couponValidation = await applyCoupon(couponCode, userId, subtotal, productIds);

  if (!couponValidation.isValid) {
    throw new Error("Mã giảm giá không hợp lệ");
  }

  cart.applied_coupon = {
    code: couponCode.toUpperCase(),
    discount_amount: couponValidation.discountAmount,
    discount_type: couponValidation.coupon.discountType === "percentage" ? "percentage" : "fixed",
  };

  cart.final_total = couponValidation.finalAmount;

  await cart.save();

  logger.info(`[CART] Áp dụng mã giảm giá ${couponCode} cho user ${userId}`);

  return {
    cart,
    couponInfo: couponValidation,
  };
};

// Xóa mã giảm giá
const removeCoupon = async (userId) => {
  try {
    const cart = await getOrCreateCart(userId);

    if (!cart.applied_coupon || Object.keys(cart.applied_coupon).length === 0) {
      logger.info(`[CART] Không có mã giảm giá để xóa cho user ${userId}`);
      return cart;
    }

    cart.applied_coupon = {};

    // Nếu bạn tính total dựa trên coupon, nên reset lại total = subtotal
    cart.total = cart.subtotal;

    await cart.save();

    logger.info(`[CART] Đã xóa mã giảm giá cho user ${userId}`);
    return cart;
  } catch (error) {
    logger.error(`[CART] Lỗi khi xóa mã giảm giá: ${error.message}`);
    throw error;
  }
};

// Bulk update nhiều items cùng lúc
const bulkUpdateItems = async (userId, updates) => {
  try {
    logger.info("[BULK UPDATE SERVICE] userId =", userId);
    logger.info("[BULK UPDATE SERVICE] updates =", JSON.stringify(updates));

    const cart = await getOrCreateCart(userId);

    // Bước 1. Gộp các items trùng nhau
    const itemMap = new Map();

    for (const item of cart.items) {
      const key = `${item.product.toString()}_${(item.selected_variant.color?.name || "").toLowerCase()}_${item.selected_variant.size}`;

      if (itemMap.has(key)) {
        const existing = itemMap.get(key);
        existing.quantity += Number(item.quantity);
        existing.total_price = existing.quantity * Number(existing.unit_price);
      } else {
        itemMap.set(key, {
          ...item.toObject(),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price),
        });
      }
    }

    // Thay cart.items = items đã gộp
    cart.items = Array.from(itemMap.values());

    // Bước 2. Xử lý updates
    for (const update of updates) {
      const { product_id, selected_variant, quantity } = update;

      const colorFromPayload = (selected_variant.color || "").trim().toLowerCase();
      const sizeFromPayload = (selected_variant.size || "").toString();

      const itemIndex = cart.items.findIndex((item) => {
        const colorFromDB = (item.selected_variant?.color?.name || "").trim().toLowerCase();
        const sizeFromDB = (item.selected_variant?.size || "").toString();
        return item.product?.toString() === product_id && colorFromDB === colorFromPayload && sizeFromDB === sizeFromPayload && !item.saved_for_later;
      });

      if (quantity === 0) {
        if (itemIndex > -1) {
          cart.items.splice(itemIndex, 1);
        }
        continue;
      }

      const { variant: validatedVariant, currentPrice } = await validateProductAndVariant(product_id, selected_variant, quantity);

      if (itemIndex > -1) {
        // Nếu có item → update số lượng
        cart.items[itemIndex].quantity = Number(quantity);
        cart.items[itemIndex].unit_price = Number(currentPrice);
        cart.items[itemIndex].total_price = Number(quantity) * Number(currentPrice);
        cart.items[itemIndex].updated_at = new Date();
      } else {
        // Nếu chưa có → thêm mới
        cart.items.push({
          product: product_id,
          selected_variant: {
            color: {
              name: validatedVariant.color?.name,
              hex: validatedVariant.color?.hex,
            },
            size: validatedVariant.size,
            price: Number(validatedVariant.price),
            stock: Number(validatedVariant.stock),
          },
          quantity: Number(quantity),
          unit_price: Number(currentPrice),
          total_price: Number(quantity) * Number(currentPrice),
          saved_for_later: false,
          added_at: new Date(),
          updated_at: new Date(),
        });
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
        // Validate sản phẩm & variant, lấy giá hiện tại
        const { currentPrice } = await validateProductAndVariant(item.product, item.selected_variant, 1);

        const oldPrice = item.unit_price != null ? parseFloat(item.unit_price.toString()) : 0;

        if (oldPrice !== currentPrice) {
          item.unit_price = currentPrice;
          item.total_price = item.quantity * currentPrice;
          item.updated_at = new Date();
        }
      } catch (error) {
        // Log cảnh báo, không throw để không fail cả quá trình
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
  const cart = await getOrCreateCart(userId);

  const activeItems = cart.items.filter((item) => !item.saved_for_later);
  const subtotal = activeItems.reduce((sum, item) => sum + parseFloat(item.total_price?.toString() || 0), 0);

  let discountAmount = 0;
  let total = subtotal;

  if (cart.applied_coupon) {
    discountAmount = parseFloat(cart.applied_coupon.discount_amount || 0);
    total = subtotal - discountAmount;
    if (total < 0) total = 0;
  }

  return {
    total_items: activeItems.length,
    total_quantity: activeItems.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    discount_amount: discountAmount,
    total,
    saved_items_count: cart.items.filter((i) => i.saved_for_later).length,
    applied_coupon: cart.applied_coupon?.code || null,
    last_updated: cart.updated_at,
  };
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
  saveCartCoupon,
};
