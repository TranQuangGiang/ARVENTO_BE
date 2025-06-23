import orderService from "../services/order.service.js";
import { baseResponse } from "../utils/index.js";
import { logger } from "../config/index.js";

import { createOrderSchema } from "../validations/order.validation.js";
// ...existing code...
const createOrder = async (req, res) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details.map((e) => e.message).join(", "));
    }
    const user = req.user._id;
    const order = await orderService.createOrder({ user, ...value });
    return baseResponse.createdResponse(res, order, "Tạo đơn hàng thành công");
  } catch (err) {
    if (err.details) {
      return baseResponse.badRequestResponse(res, err.details, "Tạo đơn hàng thất bại");
    }
    logger.error(`[ORDER] Tạo đơn hàng thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};
const getMyOrders = async (req, res) => {
  try {
    const user = req.user._id;
    const orders = await orderService.getMyOrders(user);
    return baseResponse.successResponse(res, orders, "Lấy danh sách đơn hàng thành công");
  } catch (err) {
    logger.error(`[ORDER] Lấy đơn hàng thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderDetail(id);
    if (!order) {
      return baseResponse.notFoundResponse(res, null, "Không tìm thấy đơn hàng");
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return baseResponse.forbiddenResponse(res, null, "Bạn không có quyền xem đơn hàng này");
    }
    return baseResponse.successResponse(res, order, "Lấy chi tiết đơn hàng thành công");
  } catch (err) {
    logger.error(`[ORDER] Lấy chi tiết đơn hàng thất bại: ${err.message}`);
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
      user: req.query.user,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort: req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 },
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
    const { id } = req.params;
    const { status } = req.body;
    const changedBy = req.user._id;
    const order = await orderService.updateOrderStatus(id, status, changedBy);
    return baseResponse.successResponse(res, order, "Cập nhật trạng thái đơn hàng thành công");
  } catch (err) {
    logger.error(`[ORDER] Cập nhật trạng thái đơn hàng thất bại: ${err.message}`);
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
  createOrder,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderTimeline,
  getOrderStats,
  getRecentOrders,
  getRevenueByDate,
  exportOrders,
};
