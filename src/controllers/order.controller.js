import orderService from "../services/order.service.js";
import { baseResponse } from "../utils/index.js";
import { logger } from "../config/index.js";
// import { validate } from "../middlewares/validate.middleware.js";
import path from 'path';
import {
  createOrderSchema,
  createOrderFromCartSchema,
  adminUpdateOrderStatusSchema,
  getOrdersQuerySchema,
  clientUpdateOrderStatusSchema,
  // exportOrdersQuerySchema, revenueQuerySchema
} from "../validations/order.validation.js";
import { getOrderConfirmationEmailTemplate, sendEmail } from "../utils/email.util.js";
import mongoose from "mongoose";

// Helper function to parse sort parameter
const parseSortParam = (sortParam) => {
  try {
    // If it's already an object, return it
    if (typeof sortParam === "object") return sortParam;

    // If it's a string like "-created_at", convert to object
    if (typeof sortParam === "string") {
      if (sortParam.startsWith("-")) {
        const field = sortParam.substring(1);
        return { [field]: -1 };
      } else {
        return { [sortParam]: 1 };
      }
    }

    // Try to parse as JSON
    return JSON.parse(sortParam);
  } catch (e) {
    // Default sort if parsing fails
    logger.error(`[ORDER] Failed to parse sort parameter: ${e}`);
    return { createdAt: -1 };
  }
};
// Tạo đơn hàng mới(chọn từ giỏ hàng)
const createOrder = async (req, res) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details.map((e) => e.message).join(", "));
    }

    const user = req.user._id;
    const order = await orderService.createOrder({ user, ...value });
    const paymentMethodLabels = {
      cod: "Thanh toán khi nhận hàng",
      momo: "Thanh toán qua MoMo",
      vnpay: "Thanh toán qua VNPAY",
      bank_transfer: "Chuyển khoản ngân hàng",
    };
    const html = getOrderConfirmationEmailTemplate({
      fullName: req.user.name,
      phone: order.shipping_address?.phone || "",
      address: order.shipping_address?.detail ? `${order.shipping_address.detail}, ${order.shipping_address.ward}, ${order.shipping_address.district}, ${order.shipping_address.province}` : "",
      orderId: order._id,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        unit_price: parseFloat(i.unit_price?.toString?.() || "0"),
        total_price: parseFloat(i.total_price?.toString?.() || "0"),
      })),
      total: order.total,
      paymentMethod: paymentMethodLabels[order.payment_method] || "Chưa xác định",
    });

    await sendEmail(req.user.email, "Xác nhận đơn hàng", html);

    logger.info(`[ORDER] Created order ${order._id} for user ${user}`);
    return baseResponse.createdResponse(res, order, "Tạo đơn hàng thành công");
  } catch (err) {
    if (err.details) {
      return baseResponse.badRequestResponse(res, err.details, "Tạo đơn hàng thất bại");
    }

    logger.error(`[ORDER] Tạo đơn hàng thất bại: ${err.message}`, {
      stack: err.stack,
      userId: req.user?._id,
      body: req.body,
    });

    if (err.message.includes("không tồn tại") || err.message.includes("không khả dụng")) {
      return baseResponse.notFoundResponse(res, null, err.message);
    }
    if (err.message.includes("không đủ") || err.message.includes("tồn kho")) {
      return baseResponse.badRequestResponse(res, null, err.message);
    }
    if (err.message.includes("không hợp lệ")) {
      return baseResponse.badRequestResponse(res, null, err.message);
    }

    return baseResponse.errorResponse(res, null, err.message, err.statusCode || 500);
  }
};

// Tạo đơn hàng từ giỏ hàng
const createOrderFromCart = async (req, res) => {
  try {
    const { error, value } = createOrderFromCartSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details.map((e) => e.message).join(", "));
    }

    const userId = req.user._id;
    const order = await orderService.createOrderFromCart(userId, value);

    await sendEmail(
      req.user.email,
      "Xác nhận đơn hàng",
      `<p>Chào ${req.user.name || "bạn"},</p>
      <p>Chúng tôi đã nhận được đơn hàng <strong>#${order._id}</strong>.</p>
      <p>Tổng tiền: <strong>${order.total.toLocaleString()}₫</strong></p>
      <p>Cảm ơn bạn đã mua hàng tại hệ thống của chúng tôi!</p>`
    );

    logger.info(`[ORDER] Created order ${order._id} from cart for user ${userId}`);
    return baseResponse.createdResponse(res, order, "Tạo đơn hàng từ giỏ hàng thành công");
  } catch (err) {
    logger.error(`[ORDER] Tạo đơn hàng từ giỏ hàng thất bại: ${err.message}`, {
      stack: err.stack,
      userId: req.user?._id,
      body: req.body,
    });

    if (err.message.includes("trống") || err.message.includes("không có sản phẩm")) {
      return baseResponse.badRequestResponse(res, null, err.message);
    }
    if (err.message.includes("không tồn tại") || err.message.includes("không khả dụng")) {
      return baseResponse.notFoundResponse(res, null, err.message);
    }
    if (err.message.includes("không đủ") || err.message.includes("tồn kho")) {
      return baseResponse.badRequestResponse(res, null, err.message);
    }
    if (err.message.includes("không hợp lệ")) {
      return baseResponse.badRequestResponse(res, null, err.message);
    }

    return baseResponse.errorResponse(res, null, err.message, err.statusCode || 500);
  }
};
const getMyOrders = async (req, res) => {
  try {
    const { error, value } = getOrdersQuerySchema.validate(req.query, { abortEarly: false });
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details.map((e) => e.message).join(", "));
    }

    const user = req.user._id;
    const result = await orderService.getMyOrders(user, value);

    return baseResponse.successResponse(res, result, "Lấy danh sách đơn hàng thành công");
  } catch (err) {
    logger.error(`[ORDER] Lấy đơn hàng thất bại: ${err.message}`, {
      stack: err.stack,
      userId: req.user?._id,
      query: req.query,
    });
    return baseResponse.errorResponse(res, null, err.message);
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    // const userId = req.user._id;

    // Use service method with user restriction for regular users
    const order = await orderService.getOrderDetail(id);

    return baseResponse.successResponse(res, order, "Lấy chi tiết đơn hàng thành công");
  } catch (err) {
    logger.error(`[ORDER] Lấy chi tiết đơn hàng thất bại: ${err.message}`, {
      stack: err.stack,
      orderId: req.params.id,
      userId: req.user?._id,
    });

    if (err.message.includes("Không tìm thấy")) {
      return baseResponse.notFoundResponse(res, null, err.message);
    }

    return baseResponse.errorResponse(res, null, err.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const user = req.user._id;
    const { id } = req.params;
    const note = req.body.note;
    const order = await orderService.cancelOrder(id, user, note);
    return baseResponse.successResponse(res, order, "Hủy đơn hàng thành công");
  } catch (err) {
    logger.error(`[ORDER] Hủy đơn hàng thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};

const getAllOrders = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      payment_status: req.query.payment_status,
      payment_method: req.query.payment_method,
      user: req.query.user,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      is_return_requested: req.query.is_return_requested,
    };
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort: req.query.sort ? parseSortParam(req.query.sort) : { createdAt: -1 },
    };
    const result = await orderService.getAllOrders(filters, options);
    return baseResponse.successResponse(res, result, "Lấy danh sách đơn hàng thành công");
  } catch (err) {
    logger.error(`[ORDER] Lấy tất cả đơn hàng thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { error, value } = adminUpdateOrderStatusSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details.map((e) => e.message).join(", "));
    }

    const { id } = req.params;
    const { status, note, is_return_requested } = value;
    const changedBy = req.user._id;
    const role = req.user.role;

    const order = await orderService.updateOrderStatus(id, status, changedBy, note, is_return_requested, role, changedBy);

    return baseResponse.successResponse(res, order, "Cập nhật trạng thái đơn hàng thành công");
  } catch (err) {
    logger.error(`[ORDER] Cập nhật trạng thái đơn hàng thất bại: ${err.message}`, {
      stack: err.stack,
      orderId: req.params.id,
      userId: req.user?._id,
      body: req.body,
    });

    if (err.message.includes("Không tìm thấy")) {
      return baseResponse.notFoundResponse(res, null, err.message);
    }

    return baseResponse.errorResponse(res, null, err.message);
  }
};

const clientRequestReturn = async (req, res) => {
  try {
    const { error, value } = clientUpdateOrderStatusSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details.map((e) => e.message).join(", "));
    }

    const { id } = req.params;
    const { note } = value;
    const userId = req.user._id;

    const order = await orderService.clientRequestReturn(id, userId, note);

    return baseResponse.successResponse(res, order, "Yêu cầu trả hàng đã được ghi nhận");
  } catch (err) {
    logger.error(`[ORDER] Client yêu cầu trả hàng lỗi: ${err.message}`, {
      stack: err.stack,
      orderId: req.params.id,
      userId: req.user?._id,
      body: req.body,
    });

    if (err.message.includes("Không tìm thấy")) {
      return baseResponse.notFoundResponse(res, null, err.message);
    }

    return baseResponse.errorResponse(res, null, err.message);
  }
};

const getOrderTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const timeline = await orderService.getOrderTimeline(id);
    return baseResponse.successResponse(res, timeline, "Lấy lịch sử trạng thái đơn hàng thành công");
  } catch (err) {
    logger.error(`[ORDER] Lấy timeline đơn hàng thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};
const getOrderStats = async (req, res) => {
  try {
    const [totalOrders, totalRevenue, statusStats] = await Promise.all([orderService.countAllOrders(), orderService.sumOrderRevenue(), orderService.countOrdersByStatus()]);
    return baseResponse.successResponse(res, { totalOrders, totalRevenue, statusStats }, "Lấy thống kê thành công");
  } catch (err) {
    logger.error(`[ORDER] Lấy thống kê thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};

const getRevenueByDate = async (req, res) => {
  try {
    const { from, to, groupBy } = req.query;
    const data = await orderService.getRevenueByDate({ from, to, groupBy });
    return baseResponse.successResponse(res, data, "Lấy doanh thu theo thời gian thành công");
  } catch (err) {
    logger.error(`[ORDER] Lấy doanh thu theo thời gian thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};

const getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const orders = await orderService.getRecentOrders(limit);
    return baseResponse.successResponse(res, orders, "Lấy đơn hàng mới nhất thành công");
  } catch (err) {
    logger.error(`[ORDER] Lấy đơn hàng mới nhất thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};

const exportOrders = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fileBuffer = await orderService.exportOrders({ from, to });
    res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(fileBuffer);
  } catch (err) {
    logger.error(`[ORDER] Xuất đơn hàng thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};
const confirmReturnController = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;

    // Validate user
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized: User not found.' });
    }

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID.' });
    }

    // Validate files
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Vui lòng upload ít nhất 1 ảnh xác nhận.' });
    }

    // Validate file paths
    const uploadDir = path.resolve('uploads/returns/');
    const isValidPath = files.every((file) => file.path.startsWith(uploadDir));
    if (!isValidPath) {
      return res.status(400).json({ message: 'Invalid file path.' });
    }

    await orderService.confirmReturnService(id, files.map((f) => f.path), req.user._id);

    res.status(200).json({ message: 'Xác nhận hoàn hàng thành công.' });
  } catch (error) {
    console.error(`Error confirming return for order ${req.params.id}:`, error.message, error.stack);
    if (error.message === 'Đơn hàng không tồn tại.') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'User email not found for this order.') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server.' });
  }
};
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
  getOrderTimeline,

  // Statistics and reporting
  getOrderStats,
  getRecentOrders,
  getRevenueByDate,
  exportOrders,
  confirmReturnController,
};
