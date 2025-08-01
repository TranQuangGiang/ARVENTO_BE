import dashboardService from "../services/dashboard.service.js";
import responseUtil from "../utils/response.util.js";

const dashboardController = {
  // 1. Tổng quan hệ thống
  async getOverview(req, res) {
    try {
      const data = await dashboardService.getSystemOverview();
      responseUtil.successResponse(res, data, "Lấy tổng quan hệ thống thành công");
    } catch (err) {
      responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
    }
  },

  // 2. Thống kê doanh thu
  async getRevenueStats(req, res) {
    try {
      const { from, to } = req.query;
      const stats = await dashboardService.getRevenueByDateFullFill({ from, to });
      responseUtil.successResponse(res, stats, "Lấy thống kê doanh thu thành công");
    } catch (err) {
      responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
    }
  },

  // 3. Thống kê đơn hàng theo trạng thái
  async getOrderStatusStats(req, res) {
    try {
      const stats = await dashboardService.getOrderStatusStats();
      responseUtil.successResponse(res, stats, "Lấy thống kê trạng thái đơn hàng thành công");
    } catch (err) {
      responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
    }
  },

  async getTopSellingProducts(req, res) {
    try {
      const { limit = 10 } = req.query;
      const products = await dashboardService.getTopSellingProducts(Number(limit));
      responseUtil.successResponse(res, products, "Lấy sản phẩm bán chạy thành công");
    } catch (err) {
      responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
    }
  },

  // 5. Người dùng mới
  async getNewUsers(req, res) {
    try {
      const { from, to } = req.query;
      const data = await dashboardService.getNewUsers({ from, to });
      responseUtil.successResponse(res, data, "Lấy người dùng mới thành công");
    } catch (err) {
      responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
    }
  },

  // // 6. Thống kê coupon
  // async getCouponUsageStats(req, res) {
  //   try {
  //     const stats = await dashboardService.getCouponUsageStats();
  //     responseUtil.successResponse(res, stats, "Lấy thống kê coupon thành công");
  //   } catch (err) {
  //     responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
  //   }
  // },
  async getTopDiscountUsed(req, res) {
    try {
      const data = await dashboardService.getTopDiscountUsed();
      responseUtil.successResponse(res, data, "Lấy mã giảm giá sử dụng nhiều thành công");
    } catch (err) {
      responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
    }
  },
  async getLowStockProducts(req, res) {
    try {
      const data = await dashboardService.getStockWarning();
      responseUtil.successResponse(res, data, "Lấy sản phẩm sắp hết hàng thành công");
    } catch (err) {
      responseUtil.errorResponse(res, null, "Lỗi server: " + err.message);
    }
  },
};

export default dashboardController;
