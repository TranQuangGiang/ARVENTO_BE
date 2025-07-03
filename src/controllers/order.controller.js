import orderService from "../services/order.service.js";
import { baseResponse } from "../utils/index.js";
import { logger } from "../config/index.js";
// import { validate } from "../middlewares/validate.middleware.js";

import {
  createOrderSchema,
  createOrderFromCartSchema,
  updateOrderStatusSchema,
  getOrdersQuerySchema,
  // exportOrdersQuerySchema, revenueQuerySchema
} from "../validations/order.validation.js";

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
// Tạo đơn hàng mới với cấu trúc chi tiết
const createOrder = async (req, res) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details.map((e) => e.message).join(", "));
    }

    const user = req.user._id;
    const order = await orderService.createOrder({ user, ...value });

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
    const userId = req.user._id;

    // Use service method with user restriction for regular users
    const order = await orderService.getOrderDetail(id, userId);

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
    const order = await orderService.cancelOrder(id, user);
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
    const { error, value } = updateOrderStatusSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details.map((e) => e.message).join(", "));
    }

    const { id } = req.params;
    const { status, note } = value;
    const changedBy = req.user._id;

    const order = await orderService.updateOrderStatus(id, status, changedBy, note);

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
  getOrderTimeline,

  // Statistics and reporting
  getOrderStats,
  getRecentOrders,
  getRevenueByDate,
  exportOrders,
};
