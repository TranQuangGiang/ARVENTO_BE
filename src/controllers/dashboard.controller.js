import orderService from "../services/order.service.js";
import userService from "../services/user.service.js";
import productService from "../services/product.service.js";
import couponService from "../services/coupon.service.js";
import responseUtil from "../utils/response.util.js";

const dashboardController = {
  // 1. Tổng quan hệ thống
  async getOverview(req, res) {
    try {
      const [userCount, orderCount, productCount, couponCount] = await Promise.all([userService.countUsers(), orderService.countOrders(), productService.countProducts(), couponService.countCoupons()]);
      responseUtil.successResponse(res, { userCount, orderCount, productCount, couponCount }, "Lấy tổng quan hệ thống thành công");
    } catch (err) {
      responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
    }
  },

  // 2. Thống kê doanh thu
  async getRevenueStats(req, res) {
    try {
      const { from, to } = req.query;
      const stats = await orderService.getRevenueStats({ from, to });
      responseUtil.successResponse(res, stats, "Lấy thống kê doanh thu thành công");
    } catch (err) {
      responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
    }
  },

  // 3. Thống kê đơn hàng theo trạng thái
  async getOrderStatusStats(req, res) {
    try {
      const stats = await orderService.getOrderStatusStats();
      responseUtil.successResponse(res, stats, "Lấy thống kê trạng thái đơn hàng thành công");
    } catch (err) {
      responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
    }
  },

  // 4. Sản phẩm bán chạy
  async getTopSellingProducts(req, res) {
    try {
      const { limit = 10 } = req.query;
      const products = await productService.getTopSellingProducts(Number(limit));
      responseUtil.successResponse(res, products, "Lấy sản phẩm bán chạy thành công");
    } catch (err) {
      responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
    }
  },

  // 5. Người dùng mới
  async getNewUsers(req, res) {
    try {
      const { limit = 10 } = req.query;
      const users = await userService.getNewUsers(Number(limit));
      responseUtil.successResponse(res, users, "Lấy người dùng mới thành công");
    } catch (err) {
      responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
    }
  },

  // 6. Thống kê coupon
  async getCouponUsageStats(req, res) {
    try {
      const stats = await couponService.getCouponUsageStats();
      responseUtil.successResponse(res, stats, "Lấy thống kê coupon thành công");
    } catch (err) {
      responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
    }
  },
};

export default dashboardController;
