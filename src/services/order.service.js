import Order from "../models/order.model.js";
import { Product } from "../models/index.js";
import Variant from "../models/variant.model.js";
import Address from "../models/address.model.js";
import cartService from "./cart.service.js";
import logger from "../config/logger.config.js";
import ExcelJS from "exceljs";
import mongoose from "mongoose";

// Validate và kiểm tra tồn kho cho variant
const validateOrderItem = async (item) => {
  try {
    // Validate product exists
    const product = await Product.findById(item.product);
    if (!product) {
      throw new Error("Sản phẩm không tồn tại");
    }

    if (!product.isActive) {
      throw new Error("Sản phẩm hiện không khả dụng");
    }

    // Handle new detailed variant structure
    if (item.selected_variant) {
      const { color, size, sku } = item.selected_variant;

      // Find variant by color, size, and sku
      const dbVariant = await Variant.findOne({
        product_id: item.product,
        "color.name": color.name,
        size: size,
        sku: sku,
      });

      if (!dbVariant) {
        throw new Error(`Variant ${color.name} - ${size} (${sku}) không tồn tại`);
      }

      if (dbVariant.stock < item.quantity) {
        throw new Error(`Không đủ tồn kho variant ${color.name} - ${size} (còn ${dbVariant.stock})`);
      }

      return { product, variant: dbVariant };
    }

    // Handle backward compatibility with old variant structure
    if (item.variant && Object.keys(item.variant).length > 0) {
      const idx = product.variants?.findIndex((v) => {
        let match = true;
        for (const key in item.variant) {
          if (item.variant[key] !== v[key]) match = false;
        }
        return match;
      });

      if (idx === -1) {
        throw new Error("Biến thể không tồn tại");
      }

      if (product.variants[idx].stock < item.quantity) {
        throw new Error(`Không đủ tồn kho biến thể (còn ${product.variants[idx].stock})`);
      }

      return { product, variantIndex: idx };
    }

    // Handle products without variants
    if (product.stock !== undefined) {
      if (product.stock < item.quantity) {
        throw new Error(`Không đủ tồn kho sản phẩm (còn ${product.stock})`);
      }
      return { product };
    }

    throw new Error("Sản phẩm không có thông tin tồn kho");
  } catch (error) {
    logger.error(`[ORDER] Validation error for item ${item.product}: ${error.message}`);
    throw error;
  }
};

// Kiểm tra và cập nhật tồn kho cho tất cả items
const checkAndUpdateStock = async (items) => {
  const errors = [];
  const updates = [];
  const validatedItems = [];

  // Validate all items first
  for (const item of items) {
    try {
      const validated = await validateOrderItem(item);
      validatedItems.push({ item, ...validated });
    } catch (error) {
      errors.push({
        product: item.product,
        variant: item.selected_variant || item.variant,
        message: error.message,
      });
    }
  }

  if (errors.length > 0) {
    const err = new Error("Lỗi kiểm tra tồn kho");
    err.details = errors;
    throw err;
  }

  // Update stock for all validated items
  for (const { item, product, variant, variantIndex } of validatedItems) {
    try {
      if (variant) {
        // Update variant stock in separate collection
        variant.stock -= item.quantity;
        updates.push(variant.save());
        logger.info(`[ORDER] Updated variant stock: ${variant.sku}, remaining: ${variant.stock}`);
      } else if (variantIndex !== undefined) {
        // Update variant stock in product.variants array (backward compatibility)
        product.variants[variantIndex].stock -= item.quantity;
        updates.push(product.save());
        logger.info(`[ORDER] Updated product variant stock: ${product.variants[variantIndex].sku}`);
      } else {
        // Update product stock
        product.stock -= item.quantity;
        updates.push(product.save());
        logger.info(`[ORDER] Updated product stock: ${product.name}, remaining: ${product.stock}`);
      }
    } catch (error) {
      logger.error(`[ORDER] Error updating stock for ${item.product}: ${error.message}`);
      throw error;
    }
  }

  await Promise.all(updates);
  logger.info(`[ORDER] Successfully updated stock for ${validatedItems.length} items`);
};

// Tạo đơn hàng mới với cấu trúc mới
const createOrder = async (orderData) => {
  try {
    const {
      user,
      items,
      subtotal,
      applied_coupon,
      total,
      shipping_address,
      billing_address,
      payment_method = "cod",
      note,
      // Backward compatibility
      address,
    } = orderData;

    logger.info(`[ORDER] Creating order for user: ${user}, items: ${items.length}`);

    // Validate shipping address
    if (shipping_address) {
      const shippingAddr = await Address.findById(shipping_address);
      if (!shippingAddr || shippingAddr.user.toString() !== user.toString()) {
        throw new Error("Địa chỉ giao hàng không hợp lệ");
      }
    }

    // Validate billing address if provided
    if (billing_address) {
      const billingAddr = await Address.findById(billing_address);
      if (!billingAddr || billingAddr.user.toString() !== user.toString()) {
        throw new Error("Địa chỉ thanh toán không hợp lệ");
      }
    }

    // Check stock and validate items
    await checkAndUpdateStock(items);

    // Create order with new structure
    const orderPayload = {
      user,
      items,
      subtotal: mongoose.Types.Decimal128.fromString(subtotal.toString()),
      total: mongoose.Types.Decimal128.fromString(total.toString()),
      shipping_address,
      billing_address,
      payment_method,
      note: note || "",
      status: "pending",
      payment_status: "pending",
    };

    // Add coupon if provided
    if (applied_coupon && applied_coupon.code) {
      orderPayload.applied_coupon = {
        code: applied_coupon.code,
        discount_amount: mongoose.Types.Decimal128.fromString(applied_coupon.discount_amount.toString()),
        discount_type: applied_coupon.discount_type || "percentage",
      };
    }

    // Backward compatibility - keep old address field
    if (address) {
      orderPayload.address = address;
    }

    const order = await Order.create(orderPayload);

    logger.info(`[ORDER] Created order: ${order._id}`);
    return order;
  } catch (error) {
    logger.error(`[ORDER] Error creating order: ${error.message}`);
    throw error;
  }
};

// Tạo đơn hàng từ giỏ hàng
const createOrderFromCart = async (userId, orderData) => {
  try {
    const { shipping_address, billing_address, payment_method, note, use_cart_coupon = true } = orderData;

    logger.info(`[ORDER] Creating order from cart for user: ${userId}`);

    // Get user's cart
    const cart = await cartService.getCart(userId, false); // Don't include saved items

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error("Giỏ hàng trống");
    }

    // Filter active items (not saved for later)
    const activeItems = cart.items.filter((item) => !item.saved_for_later);

    if (activeItems.length === 0) {
      throw new Error("Không có sản phẩm nào trong giỏ hàng để tạo đơn hàng");
    }

    // Convert cart items to order items
    const orderItems = activeItems.map((cartItem) => ({
      product: cartItem.product,
      selected_variant: cartItem.selected_variant,
      quantity: cartItem.quantity,
      unit_price: cartItem.unit_price,
      total_price: cartItem.total_price,
    }));

    // Prepare order data
    const orderPayload = {
      user: userId,
      items: orderItems,
      subtotal: cart.subtotal,
      total: cart.total,
      shipping_address,
      billing_address,
      payment_method,
      note,
    };

    // Add coupon if cart has one and user wants to use it
    if (use_cart_coupon && cart.applied_coupon && cart.applied_coupon.code) {
      orderPayload.applied_coupon = cart.applied_coupon;
    }

    // Create the order
    const order = await createOrder(orderPayload);

    // Clear the cart after successful order creation
    await cartService.clearCart(userId);

    logger.info(`[ORDER] Successfully created order ${order._id} from cart`);
    return order;
  } catch (error) {
    logger.error(`[ORDER] Error creating order from cart: ${error.message}`);
    throw error;
  }
};

const getMyOrders = async (user, filters = {}) => {
  try {
    const query = { user };

    // Add filters
    if (filters.status) query.status = filters.status;
    if (filters.payment_status) query.payment_status = filters.payment_status;
    if (filters.payment_method) query.payment_method = filters.payment_method;

    if (filters.dateFrom || filters.dateTo) {
      query.created_at = {};
      if (filters.dateFrom) query.created_at.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.created_at.$lte = new Date(filters.dateTo);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const sort = filters.sort || { created_at: -1 };

    const orders = await Order.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("items.product", "name images slug")
      .populate("shipping_address")
      .populate("billing_address");

    const total = await Order.countDocuments(query);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`[ORDER] Error getting user orders: ${error.message}`);
    throw error;
  }
};

const getOrderDetail = async (id, userId = null) => {
  try {
    const query = { _id: id };
    if (userId) query.user = userId; // Restrict to user's own orders if userId provided

    const order = await Order.findOne(query).populate("user", "name email phone").populate("items.product", "name images slug description").populate("shipping_address", "name phone detail ward district province isDefault").populate("billing_address", "name phone detail ward district province isDefault").populate("timeline.changedBy", "name email");

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    return order;
  } catch (error) {
    logger.error(`[ORDER] Error getting order detail: ${error.message}`);
    throw error;
  }
};

const cancelOrder = async (orderId, userId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error("Không tìm thấy đơn hàng");
      err.status = 404;
      throw err;
    }

    // Chỉ cho phép hủy nếu là chủ đơn và trạng thái còn pending/confirmed
    if (order.user.toString() !== userId.toString()) {
      const err = new Error("Bạn không có quyền hủy đơn hàng này");
      err.status = 403;
      throw err;
    }

    if (!order.canBeCancelled()) {
      const err = new Error("Chỉ có thể hủy đơn hàng khi đang chờ xác nhận hoặc đã xác nhận");
      err.status = 400;
      throw err;
    }

    // Update order status
    order.status = "cancelled";
    order.payment_status = "cancelled";

    // Add timeline entry
    await order.addTimelineEntry("cancelled", userId, "Đơn hàng đã được hủy bởi khách hàng");

    // Restore stock for all items
    const stockUpdates = [];
    for (const item of order.items) {
      try {
        const product = await Product.findById(item.product);
        if (!product) {
          logger.warn(`[ORDER] Product ${item.product} not found when restoring stock`);
          continue;
        }

        // Handle new detailed variant structure
        if (item.selected_variant) {
          const { color, size, sku } = item.selected_variant;
          const variant = await Variant.findOne({
            product_id: item.product,
            "color.name": color.name,
            size: size,
            sku: sku,
          });

          if (variant) {
            variant.stock += item.quantity;
            stockUpdates.push(variant.save());
            logger.info(`[ORDER] Restored stock for variant ${sku}: +${item.quantity}`);
          }
        }
        // Handle backward compatibility with old variant structure
        else if (item.variant && Object.keys(item.variant).length > 0) {
          const idx = product.variants?.findIndex((v) => {
            let match = true;
            for (const key in item.variant) {
              if (item.variant[key] !== v[key]) match = false;
            }
            return match;
          });

          if (idx !== -1) {
            product.variants[idx].stock += item.quantity;
            stockUpdates.push(product.save());
            logger.info(`[ORDER] Restored stock for product variant: +${item.quantity}`);
          }
        }
        // Handle products without variants
        else if (product.stock !== undefined) {
          product.stock += item.quantity;
          stockUpdates.push(product.save());
          logger.info(`[ORDER] Restored stock for product ${product.name}: +${item.quantity}`);
        }
      } catch (error) {
        logger.error(`[ORDER] Error restoring stock for item ${item.product}: ${error.message}`);
        // Continue with other items even if one fails
      }
    }

    // Wait for all stock updates to complete
    await Promise.all(stockUpdates);

    logger.info(`[ORDER] Successfully cancelled order ${orderId} and restored stock`);
    return order;
  } catch (error) {
    logger.error(`[ORDER] Error cancelling order ${orderId}: ${error.message}`);
    throw error;
  }
};
const getAllOrders = async (filters = {}, options = {}) => {
  // filters: { status, payment_status, payment_method, user, dateFrom, dateTo, ... }
  // options: { page, limit, sort }
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.payment_status) query.payment_status = filters.payment_status;
  if (filters.payment_method) query.payment_method = filters.payment_method;
  if (filters.user) query.user = filters.user;
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }
  const page = options.page || 1;
  const limit = options.limit || 20;
  const sort = options.sort || { createdAt: -1 };
  const orders = await Order.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "name email phone")
    .populate("items.product", "name slug images price")
    .populate("shipping_address", "name phone detail ward district province isDefault")
    .populate("billing_address", "name phone detail ward district province isDefault");
  const total = await Order.countDocuments(query);
  return { orders, total, page, limit };
};
// Lưu lịch sử trạng thái đơn hàng (timeline)
const addOrderTimeline = async (orderId, status, changedBy) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (!order.timeline) order.timeline = [];
  order.timeline.push({
    status,
    changedBy,
    changedAt: new Date(),
  });
  await order.save();
  return order.timeline;
};

// Lấy lịch sử trạng thái đơn hàng
const getOrderTimeline = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  return order.timeline || [];
};

// Cập nhật trạng thái đơn hàng (admin)
const updateOrderStatus = async (orderId, status, changedBy) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  order.status = status;
  if (!order.timeline) order.timeline = [];
  order.timeline.push({
    status,
    changedBy,
    changedAt: new Date(),
  });
  await order.save();
  return order;
};
const getRecentOrders = async (limit = 10) => {
  return await Order.find().sort({ createdAt: -1 }).limit(limit).populate("user", "name email phone").populate("items.product", "name images slug price").populate("shipping_address", "name phone detail ward district province isDefault").populate("billing_address", "name phone detail ward district province isDefault");
};
const getRevenueByDate = async ({ from, to, groupBy = "day" }) => {
  const match = { status: "completed" };
  if (from || to) match.createdAt = {};
  if (from) match.createdAt.$gte = new Date(from);
  if (to) match.createdAt.$lte = new Date(to);

  const dateFormat = groupBy === "month" ? { $dateToString: { format: "%Y-%m", date: "$createdAt" } } : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

  const result = await Order.aggregate([{ $match: match }, { $group: { _id: dateFormat, revenue: { $sum: "$total" } } }, { $sort: { _id: 1 } }]);
  return result.map((r) => ({ date: r._id, revenue: r.revenue }));
};

const countOrdersByStatus = async () => {
  const result = await Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const stats = {};
  result.forEach((r) => {
    stats[r._id] = r.count;
  });
  return stats;
};
const sumOrderRevenue = async () => {
  const result = await Order.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$total" } } }]);
  return result[0]?.total || 0;
};
const countAllOrders = async () => {
  return await Order.countDocuments();
};
const exportOrders = async (filters = {}) => {
  // Lọc đơn hàng theo from, to, status, user...
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.user) query.user = filters.user;
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }
  const orders = await Order.find(query).populate("user").populate("items.product");

  // Tạo Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Orders");
  worksheet.columns = [
    { header: "Mã đơn", key: "_id", width: 24 },
    { header: "Khách hàng", key: "user", width: 24 },
    { header: "Tổng tiền", key: "total", width: 14 },
    { header: "Trạng thái", key: "status", width: 14 },
    { header: "Ngày tạo", key: "createdAt", width: 20 },
    { header: "Sản phẩm", key: "items", width: 40 },
    { header: "Địa chỉ", key: "address", width: 30 },
    { header: "Ghi chú", key: "note", width: 20 },
  ];
  orders.forEach((order) => {
    worksheet.addRow({
      _id: order._id.toString(),
      user: order.user?.name || order.user?.email || order.user?.toString(),
      total: order.total,
      status: order.status,
      createdAt: order.createdAt.toLocaleString("vi-VN"),
      items: order.items
        .map(
          (i) =>
            `${i.product?.name || i.product?.toString()} x${i.quantity}` +
            (i.variant && Object.keys(i.variant).length > 0
              ? ` (${Object.entries(i.variant)
                  .map(([k, v]) => `${k}:${v}`)
                  .join(", ")})`
              : "")
        )
        .join("; "),
      address: order.address?.detail || "",
      note: order.note || "",
    });
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer,
    filename: `orders_${Date.now()}.xlsx`,
    mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
};
const countOrders = async () => Order.countDocuments();
const countNewOrders = async (from) => Order.countDocuments({ createdAt: { $gte: new Date(from) } });

export default {
  // Core order functions
  createOrder,
  createOrderFromCart,
  getMyOrders,
  getOrderDetail,
  cancelOrder,

  // Admin functions
  getAllOrders,
  updateOrderStatus,
  addOrderTimeline,
  getOrderTimeline,

  // Statistics and reporting
  getOrderStats: async () => {
    const [totalOrders, totalRevenue, statusStats] = await Promise.all([countAllOrders(), sumOrderRevenue(), countOrdersByStatus()]);
    return { totalOrders, totalRevenue, statusStats };
  },
  countAllOrders,
  countOrders,
  countNewOrders,
  sumOrderRevenue,
  countOrdersByStatus,
  getRevenueByDate,
  getRecentOrders,
  exportOrders,

  // Utility functions
  validateOrderItem,
  checkAndUpdateStock,
};
