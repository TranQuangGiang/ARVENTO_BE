import responseUtil from '../utils/response.util.js';
import couponService from '../services/coupon.service.js';
import mongoose from 'mongoose';
// Tạo coupon mới (Admin)
const createCoupon = async (req, res) => {
  try {
    const coupon = await couponService.createCoupon(req.body);
    responseUtil.createdResponse(res, coupon, 'Tạo mã giảm giá thành công');
  } catch (error) {
    responseUtil.errorResponse(res, null, error.message, 400);
  }
};

// Lấy tất cả coupon (Admin)
const getAllCoupons = async (req, res) => {
  try {
    const result = await couponService.getAllCoupons(req.query);
    responseUtil.successResponse(res, result);
  } catch (error) {
    responseUtil.errorResponse(res, null, error.message);
  }
};

// Lấy chi tiết coupon (Admin)
const getCouponDetail = async (req, res) => {
  try {
    const coupon = await couponService.getCouponById(req.params.id);
    responseUtil.successResponse(res, coupon);
  } catch (error) {
    responseUtil.errorResponse(res, null, error.message, 404);
  }
};

// Cập nhật coupon (Admin)
const updateCoupon = async (req, res) => {
  try {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);
    responseUtil.successResponse(res, coupon, 'Cập nhật mã giảm giá thành công');
  } catch (error) {
        // Nếu coupon không tìm thấy thì trả về 404, các lỗi khác 400
    const statusCode = error.message === 'Coupon not found' ? 404 : 400;
    responseUtil.errorResponse(res, null, error.message, statusCode);
  }
};

// Xóa coupon (Admin)
const deleteCoupon = async (req, res) => {
  try {
    await couponService.deleteCoupon(req.params.id);
    responseUtil.successResponse(res, null, 'Xóa mã giảm giá thành công');
  } catch (error) {
    responseUtil.errorResponse(res, null, error.message, 404);
  }
};

// Kiểm tra coupon (Client)
const validateCoupon = async (req, res) => {
  try {
    const { code, userId, cartTotal, productIds } = req.body;
    const result = await couponService.validateCoupon(code, userId, cartTotal, productIds);
    responseUtil.successResponse(res, result, 'Mã giảm giá hợp lệ');
  } catch (error) {
    responseUtil.errorResponse(res, { isValid: false }, error.message, 400);
  }
};

// Áp dụng mã giảm giá
const applyCoupon = async (req, res) => {
  try {
    const { code, userId } = req.body;
    const coupon = await couponService.applyCoupon(code, userId);
    responseUtil.successResponse(res, coupon, 'Áp dụng mã giảm giá thành công');
  } catch (error) {
    responseUtil.errorResponse(res, null, error.message, 400);
  }
};

// Lấy lịch sử sử dụng mã
const getUsageHistory = async (req, res) => {
  try {
    const history = await couponService.getCouponUsageHistory(req.params.id);
    responseUtil.successResponse(res, history, 'Lấy lịch sử sử dụng thành công');
  } catch (error) {
    responseUtil.errorResponse(res, null, error.message, 400);
  }
};
const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId trước khi truy vấn DB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return responseUtil.badRequestResponse(res, null, 'ID không hợp lệ');
    }

    const updatedCoupon = await couponService.toggleCouponStatus(id);

    return responseUtil.successResponse(
      res,
      updatedCoupon,
      `Mã giảm giá đã được ${updatedCoupon.isActive ? 'bật' : 'tắt'} thành công`
    );
  } catch (error) {
    console.error('Toggle coupon error:', error);
    if (error.message === 'NOT_FOUND') {
      return responseUtil.notFoundResponse(res, null, 'Không tìm thấy mã giảm giá');
    }
    return responseUtil.errorResponse(res, error, 'Lỗi khi cập nhật trạng thái mã giảm giá');
  }
};
export default {
  createCoupon,
  getAllCoupons,
  getCouponDetail,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  getUsageHistory,
  toggleCouponStatus,
};