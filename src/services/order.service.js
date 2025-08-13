import Order from "../models/order.model.js";
import { addressModel, couponModel, Product } from "../models/index.js";
import Variant from "../models/variant.model.js";
import cartService from "./cart.service.js";
import logger from "../config/logger.config.js";
import ExcelJS from "exceljs";
import mongoose from "mongoose";
import Roles from "../constants/role.enum.js";
import { getCancelConfirmationEmailTemplate, getConfirmReturnEmailTemplate, getOrderStatusChangedEmailTemplate, getRefundRequestEmailTemplate, getReturnApprovedEmailTemplate, getReturnRequestEmailTemplate, sendEmail } from "../utils/email.util.js";
import fs from 'fs';
import path from 'path';
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

const createOrder = async (orderData) => {
  try {
    const { user, items, applied_coupon, shipping_address, billing_address, payment_method = "cod", note, address, shipping_fee = 0 } = orderData;

    logger.info(`[ORDER] Creating order for user: ${user}, items: ${items.length}`);

    // Lấy snapshot địa chỉ giao hàng
    let shippingAddressSnapshot = null;
    if (shipping_address) {
      const shippingAddr = await addressModel.findById(shipping_address);
      if (!shippingAddr || shippingAddr.user.toString() !== user.toString()) {
        throw new Error("Địa chỉ giao hàng không hợp lệ");
      }

      shippingAddressSnapshot = {
        phone: shippingAddr.phone || "",
        detail: shippingAddr.detail || "",
        ward: shippingAddr.ward || "",
        district: shippingAddr.district || "",
        province: shippingAddr.province || "",
        isDefault: shippingAddr.isDefault || false,
      };
    }

    // Lấy snapshot địa chỉ thanh toán
    let billingAddressSnapshot = null;
    if (billing_address) {
      const billingAddr = await addressModel.findById(billing_address);
      if (!billingAddr || billingAddr.user.toString() !== user.toString()) {
        throw new Error("Địa chỉ thanh toán không hợp lệ");
      }

      billingAddressSnapshot = {
        name: billingAddr.name ?? "",
        phone: billingAddr.phone ?? "",
        detail: billingAddr.detail ?? "",
        ward: billingAddr.ward ?? "",
        district: billingAddr.district ?? "",
        province: billingAddr.province ?? "",
        isDefault: billingAddr.isDefault ?? "",
      };
    }

    // Xử lý từng item: lấy variant, tính giá, trừ tồn kho
    let rawSubtotal = 0;
    const finalItems = [];

    for (const item of items) {
      const { product, selected_variant, quantity } = item;

      const variant = await Variant.findOne({
        product_id: product,
        size: selected_variant.size,
        "color.name": selected_variant.color.name,
      });

      if (!variant) {
        throw new Error(`Không tìm thấy biến thể sản phẩm: ${selected_variant.color.name} - ${selected_variant.size}`);
      }

      if (variant.stock < quantity) {
        throw new Error(`Sản phẩm ${variant.sku || "không xác định"} không đủ tồn kho`);
      }

      const unitPrice = variant.sale_price && parseFloat(variant.sale_price.toString()) > 0 ? parseFloat(variant.sale_price.toString()) : parseFloat(variant.price.toString());

      const itemTotal = unitPrice * quantity;
      rawSubtotal += itemTotal;

      finalItems.push({
        product,
        variant: variant._id,
        quantity,
        selected_variant,
        unit_price: mongoose.Types.Decimal128.fromString(unitPrice.toFixed(2)),
        total_price: mongoose.Types.Decimal128.fromString(itemTotal.toFixed(2)),
      });

      // Trừ tồn kho
      variant.stock -= quantity;
      await variant.save();
    }

    // Áp dụng mã giảm giá nếu có
    let discountAmount = 0;
    let couponPayload = undefined;

    if (applied_coupon?.code) {
      const couponCode = applied_coupon.code.trim().toUpperCase();
      const coupon = await couponModel.findOne({ code: couponCode });

      if (!coupon) {
        throw new Error(`Mã giảm giá "${couponCode}" không tồn tại`);
      }

      if (!coupon.isValid()) {
        throw new Error(`Mã giảm giá "${couponCode}" đã hết hạn hoặc không còn hiệu lực`);
      }

      if (coupon.perUserLimit) {
        const usedCount = await Order.countDocuments({
          user,
          "applied_coupon.code": coupon.code,
        });

        if (usedCount >= coupon.perUserLimit) {
          throw new Error(`Bạn đã sử dụng mã giảm giá "${coupon.code}" tối đa ${coupon.perUserLimit} lần`);
        }
      }

      if (coupon.minSpend && rawSubtotal < coupon.minSpend) {
        throw new Error(`Đơn hàng cần tối thiểu ${coupon.minSpend.toLocaleString()}₫ để dùng mã "${coupon.code}"`);
      }

      if (coupon.maxSpend && rawSubtotal > coupon.maxSpend) {
        throw new Error(`Đơn hàng vượt quá mức tối đa ${coupon.maxSpend.toLocaleString()}₫ cho mã "${coupon.code}"`);
      }

      if (coupon.discountType === "percentage") {
        discountAmount = rawSubtotal * (coupon.discountValue / 100);
      } else if (coupon.discountType === "fixed_amount") {
        discountAmount = coupon.discountValue;
      }

      discountAmount = Math.min(discountAmount, rawSubtotal);

      couponPayload = {
        code: coupon.code,
        discount_amount: mongoose.Types.Decimal128.fromString(discountAmount.toFixed(2)),
        discount_type: coupon.discountType,
      };

      coupon.usageCount += 1;
      await coupon.save();
    }

    const total = Math.max(0, rawSubtotal - discountAmount + shipping_fee);

    // Tạo đơn hàng
    const orderPayload = {
      user,
      items: finalItems,
      subtotal: mongoose.Types.Decimal128.fromString(rawSubtotal.toFixed(2)),
      shipping_fee: mongoose.Types.Decimal128.fromString(shipping_fee.toFixed(2)),
      total: mongoose.Types.Decimal128.fromString(total.toFixed(2)),
      shipping_address: shippingAddressSnapshot,
      billing_address: billingAddressSnapshot,
      payment_method,
      note: note || "",
      status: "pending",
      payment_status: "pending",
      ...(couponPayload && { applied_coupon: couponPayload }),
      ...(address && { address }),
    };

    const order = await Order.create(orderPayload);

    await order.populate("items.product");

    await order.populate("items.variant");

    logger.info(`[ORDER] Created order: ${order._id}`);
    return order;
  } catch (error) {
    logger.error(`[ORDER] Error creating order: ${error.message}`);
    throw error;
  }
};
const createOrderFromCart = async (userId, orderData) => {
  try {
    const { shipping_address, billing_address, payment_method, note, applied_coupon, shipping_fee = 0 } = orderData;

    logger.info(`[ORDER] Creating order from cart for user: ${userId}`);

    const cart = await cartService.getCart(userId, false);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error("Giỏ hàng trống");
    }

    const activeItems = cart.items.filter((item) => !item.saved_for_later);
    if (activeItems.length === 0) {
      throw new Error("Không có sản phẩm nào trong giỏ hàng để tạo đơn hàng");
    }

    // ----- Xử lý snapshot địa chỉ giao hàng -----
    let shippingAddressSnapshot = null;
    if (shipping_address) {
      const shippingAddr = await addressModel.findById(shipping_address);
      if (!shippingAddr || shippingAddr.user.toString() !== userId.toString()) {
        throw new Error("Địa chỉ giao hàng không hợp lệ");
      }

      shippingAddressSnapshot = {
        name: shippingAddr.name ?? "",
        phone: shippingAddr.phone ?? "",
        detail: shippingAddr.detail ?? "",
        ward: shippingAddr.ward ?? "",
        district: shippingAddr.district ?? "",
        province: shippingAddr.province ?? "",
        isDefault: shippingAddr.isDefault,
      };
    }

    // ----- Xử lý snapshot địa chỉ thanh toán -----
    let billingAddressSnapshot = null;
    if (billing_address) {
      const billingAddr = await addressModel.findById(billing_address);
      if (!billingAddr || billingAddr.user.toString() !== userId.toString()) {
        throw new Error("Địa chỉ thanh toán không hợp lệ");
      }

      billingAddressSnapshot = {
        name: billingAddr.name ?? "",
        phone: billingAddr.phone ?? "",
        detail: billingAddr.detail ?? "",
        ward: billingAddr.ward ?? "",
        district: billingAddr.district ?? "",
        province: billingAddr.province ?? "",
        isDefault: billingAddr.isDefault,
      };
    }

    // Chuẩn bị dữ liệu items: kiểm tra tồn kho, tính giá theo Variant
    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of activeItems) {
      const { product, selected_variant, quantity } = cartItem;

      const variant = await Variant.findOne({
        product_id: product,
        size: selected_variant.size,
        "color.name": selected_variant.color.name,
      });

      if (!variant) {
        throw new Error(`Không tìm thấy biến thể sản phẩm: ${selected_variant.color.name} - ${selected_variant.size}`);
      }

      if (variant.stock < quantity) {
        throw new Error(`Sản phẩm ${variant.sku || "không xác định"} không đủ tồn kho`);
      }

      const unitPrice = variant.sale_price && parseFloat(variant.sale_price.toString()) > 0 ? parseFloat(variant.sale_price.toString()) : parseFloat(variant.price.toString());

      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;

      orderItems.push({
        product,
        variant: variant._id,
        selected_variant,
        quantity,
        unit_price: mongoose.Types.Decimal128.fromString(unitPrice.toFixed(2)),
        total_price: mongoose.Types.Decimal128.fromString(totalPrice.toFixed(2)),
      });

      // Trừ tồn kho
      variant.stock -= quantity;
      await variant.save();
    }

    // Áp dụng mã giảm giá (nếu có)
    let discountAmount = 0;
    let couponPayload;

    if (applied_coupon?.code) {
      const code = applied_coupon.code.trim().toUpperCase();
      const coupon = await couponModel.findOne({ code });

      if (!coupon) throw new Error(`Mã giảm giá "${code}" không tồn tại`);
      if (!coupon.isValid()) throw new Error(`Mã giảm giá "${code}" đã hết hạn hoặc không còn hiệu lực`);

      if (coupon.perUserLimit) {
        const usedCount = await Order.countDocuments({
          user: userId,
          "applied_coupon.code": code,
        });
        if (usedCount >= coupon.perUserLimit) {
          throw new Error(`Bạn đã sử dụng mã "${code}" tối đa ${coupon.perUserLimit} lần`);
        }
      }

      if (coupon.minSpend && subtotal < coupon.minSpend) {
        throw new Error(`Đơn hàng cần tối thiểu ${coupon.minSpend.toLocaleString()}₫ để dùng mã "${code}"`);
      }

      if (coupon.maxSpend && subtotal > coupon.maxSpend) {
        throw new Error(`Đơn hàng vượt quá ${coupon.maxSpend.toLocaleString()}₫ cho mã "${code}"`);
      }

      if (coupon.discountType === "percentage") {
        discountAmount = subtotal * (coupon.discountValue / 100);
      } else if (coupon.discountType === "fixed_amount") {
        discountAmount = coupon.discountValue;
      }

      discountAmount = Math.min(discountAmount, subtotal);

      couponPayload = {
        code: coupon.code,
        discount_amount: mongoose.Types.Decimal128.fromString(discountAmount.toFixed(2)),
        discount_type: coupon.discountType,
      };

      coupon.usageCount += 1;
      await coupon.save();
    }

    const finalTotal = Math.max(0, subtotal - discountAmount + shipping_fee);

    const orderPayload = {
      user: userId,
      items: orderItems,
      subtotal: mongoose.Types.Decimal128.fromString(subtotal.toFixed(2)),
      shipping_fee: mongoose.Types.Decimal128.fromString(shipping_fee.toFixed(2)),
      total: mongoose.Types.Decimal128.fromString(finalTotal.toFixed(2)),
      shipping_address: shippingAddressSnapshot,
      billing_address: billingAddressSnapshot,
      payment_method,
      note: note || "",
      status: "pending",
      payment_status: "pending",
      ...(couponPayload && { applied_coupon: couponPayload }),
    };

    const order = await Order.create(orderPayload);

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
    if (userId) query.user = userId;

    const order = await Order.findOne(query).populate("user", "name email phone").populate("items.product", "name images slug description").populate("timeline.changedBy", "name email");
    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    return order;
  } catch (error) {
    logger.error(`[ORDER] Error getting order detail: ${error.message}`);
    throw error;
  }
};

const cancelOrder = async (orderId, userId, note) => {
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

    order.timeline ??= [];
    order.timeline.push({
      status: "cancelled",
      changedBy: userId,
      note: note || "Đơn hàng đã được hủy bởi khách hàng",
      changedAt: new Date(),
    });

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
    await order.save();
    return order;
  } catch (error) {
    logger.error(`[ORDER] Error cancelling order ${orderId}: ${error.message}`);
    throw error;
  }
};
export const getAllOrders = async (filters = {}, options = {}) => {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.payment_status) {
    query.payment_status = filters.payment_status;
  }

  if (filters.payment_method) {
    query.payment_method = filters.payment_method;
  }

  if (filters.user) {
    query.user = filters.user;
  }

  if (filters.is_return_requested !== undefined) {
    query.is_return_requested = filters.is_return_requested === "true";
  }

  if (filters.dateFrom || filters.dateTo) {
    query.created_at = {};
    if (filters.dateFrom) {
      query.created_at.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      query.created_at.$lte = toDate;
    }
  }

  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 20;
  const sort = options.sort || { created_at: -1 };

  const orders = await Order.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "name email phone")
    .populate("items.product", "name slug images price")
    .populate("shipping_address", "name phone detail ward district province isDefault")
    .populate("billing_address", "name phone detail ward district province isDefault");

  const total = await Order.countDocuments(query);

  return {
    orders,
    total,
    page,
    limit,
  };
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

// Cập nhật trạng thái đơn hàng
const allowedTransitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipping", "cancelled"],
  shipping: ["delivered", "returned"],
  delivered: ["completed", "returning", "returned"],
  returning: ["returned", "cancelled"],
  returned: [],
  completed: [],
  cancelled: [],
};
const updateOrderStatus = async (orderId, newStatus, changedBy, note = "", isReturnRequested = undefined, userRole = Roles.ADMIN, currentUserId = null) => {
  const order = await Order.findById(orderId).populate("user");
  if (!order) throw new Error("Không tìm thấy đơn hàng");

  const currentStatus = order.status;

  // Kiểm tra quyền cập nhật theo role
  if (userRole === Roles.ADMIN) {
    const allowedNext = allowedTransitions[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new Error(`Không thể chuyển trạng thái từ "${currentStatus}" sang "${newStatus}"`);
    }
  }

  if (userRole === Roles.USER) {
    if (!(currentStatus === "delivered" && newStatus === "completed")) {
      throw new Error("Bạn không có quyền thực hiện hành động này");
    }
    if (!order.user.equals(currentUserId)) {
      throw new Error("Bạn không có quyền thao tác đơn hàng này");
    }
  }

  // Cập nhật trạng thái đơn hàng
  order.status = newStatus;

  if (typeof isReturnRequested === "boolean") {
    order.is_return_requested = isReturnRequested;
  }

  order.timeline ??= [];
  order.timeline.push({
    status: newStatus,
    changedBy,
    note: note || (userRole === Roles.USER ? "Khách hàng xác nhận đã nhận hàng" : ""),
    changedAt: new Date(),
  });

  await order.save();

  if (order.user?.email) {
    try {
      if (userRole === Roles.ADMIN && newStatus === "returned") {
        return order;
      }

      let html, subject;
      if (
        userRole === Roles.ADMIN &&
        newStatus === "returned" &&
        order.payment_status === "completed"
      ) {
        html = getRefundRequestEmailTemplate({
          fullName: order.user.fullName || "Khách hàng",
          orderId: order._id,
        });
        subject = `💰 Hoàn tiền cho đơn hàng #${order._id}`;
        await sendEmail(order.user.email, subject, html);
        return order;
      }

      if (userRole === Roles.ADMIN && currentStatus !== "returning" && newStatus === "returning") {
        html = getReturnApprovedEmailTemplate({
          fullName: order.user.fullName || "Khách hàng",
          orderId: order._id,
          note,
          createdAt: order.createdAt,
        });
        subject = "📦 Yêu cầu trả hàng đã được phê duyệt";
      } else {
        html = getOrderStatusChangedEmailTemplate({
          fullName: order.user.fullName || "Khách hàng",
          orderId: order._id,
          newStatus,
          note,
          changedAt: new Date(),
        });
        subject = `🔔 Đơn hàng #${order._id} đã chuyển sang trạng thái "${newStatus}"`;
      }

      await sendEmail(order.user.email, subject, html);
    } catch (err) {
      console.error("[EMAIL] Gửi email cập nhật trạng thái thất bại:", err);
    }
  }

  return order;
};

const ADMIN_EMAIL = "quanggiang69.dev@gmail.com";

export const clientRequestReturn = async (orderId, userId, note = "") => {
  const order = await Order.findById(orderId).populate("user");
  if (!order) throw new Error("Không tìm thấy đơn hàng");

  if (order.user._id.toString() !== userId.toString()) {
    throw new Error("Bạn không có quyền thao tác đơn hàng này");
  }

  if (order.status !== "delivered") {
    throw new Error("Chỉ có thể yêu cầu trả hàng sau khi đơn đã giao thành công");
  }

  if (order.is_return_requested) {
    throw new Error("Bạn đã yêu cầu trả hàng trước đó");
  }
  const isNoteEmpty = !note || note.trim() === "";

  order.is_return_requested = true;
  order.timeline ??= [];
  order.timeline.push({
    status: order.status,
    changedBy: userId,
    changedAt: new Date(),
    note: isNoteEmpty ? "Khách hàng yêu cầu trả hàng" : note,
  });

  await order.save();

  // Gửi email admin
  const emailHtml = getReturnRequestEmailTemplate({
    fullName: order.user.fullName || order.user.email,
    orderId: order._id.toString(),
    note,
    createdAt: order.createdAt,
  });

  await sendEmail(ADMIN_EMAIL, `Yêu cầu trả hàng từ khách hàng ${order.user.fullName || order.user.email}`, emailHtml);

  // Gửi email  khách hàng
  const userEmailHtml = getCancelConfirmationEmailTemplate({
    fullName: order.user.fullName || order.user.email,
    orderId: order._id.toString(),
    note,
  });

  await sendEmail(order.user.email, `Yêu cầu huỷ đơn hàng của bạn đã được ghi nhận`, userEmailHtml);

  return order;
};

const getRecentOrders = async (limit = 10) => {
  return await Order.find().sort({ createdAt: -1 }).limit(limit).populate("user", "name email phone").populate("items.product", "name images slug price").populate("shipping_address", "name phone detail ward district province isDefault").populate("billing_address", "name phone detail ward district province isDefault");
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
const confirmReturnService = async (id, imagePath) => {
  const order = await Order.findById(id)
    .populate('user')
    .populate('items.product');
  if (!order) throw new Error('Đơn hàng không tồn tại.');

  order.status = 'returned';
  await order.save();

  const emailHtml = getConfirmReturnEmailTemplate({
    fullName: order.user?.fullName || 'Khách hàng',
    orderId: order._id,
    confirmedAt: new Date(),
    note: 'Đơn hàng đã được xác nhận hoàn hàng từ hệ thống.',
    order,
  });

  const fileName = path.basename(imagePath);

  await sendEmail(
    order.user.email,
    `Xác nhận hoàn hàng đơn #${order._id}`,
    emailHtml,
    [
      {
        filename: fileName,
        path: imagePath,
      },
    ]
  );

  fs.unlinkSync(imagePath);
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
  clientRequestReturn,
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
  getRecentOrders,
  exportOrders,

  // Utility functions
  validateOrderItem,
  checkAndUpdateStock,
  confirmReturnService,
};
