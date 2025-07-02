import responseUtil from '../utils/response.util.js';
import couponService from '../services/coupon.service.js';
import Product from "../models/product.model.js";
import mongoose from 'mongoose';
// Tạo coupon mới (Admin)
const createCoupon = async (req, res) => {
  try {
    const {
      products = [],
      excludedProducts = [],
      categories = [],
      excludedCategories = [],
    } = req.body;

    // 1. Check trùng product
    const duplicateProducts = products.filter((p) =>
      excludedProducts.includes(p)
    );
    if (duplicateProducts.length > 0) {
      return responseUtil.badRequestResponse(
        res,
        null,
        `Sản phẩm được áp dụng và không được áp dụng không được trùng nhau. Trùng: ${duplicateProducts.join(", ")}`
      );
    }

    // 2. Check trùng categories
    const duplicateCategories = categories.filter((c) =>
      excludedCategories.includes(c)
    );
    if (duplicateCategories.length > 0) {
      return responseUtil.badRequestResponse(
        res,
        null,
        `Danh mục được áp dụng và không được áp dụng không được trùng nhau. Trùng: ${duplicateCategories.join(", ")}`
      );
    }

    // 3. Nếu có products -> kiểm tra category của chúng không nằm trong excludedCategories
    if (products.length > 0 && excludedCategories.length > 0) {
      const productDocs = await Product.find({ _id: { $in: products } });
      const categoryIds = productDocs
        .map((p) => p.category_id?.toString())
        .filter(Boolean);

      const overlap = categoryIds.filter((catId) =>
        excludedCategories.includes(catId)
      );

      if (overlap.length > 0) {
        return responseUtil.badRequestResponse(
          res,
          null,
          `Danh mục bị loại trừ không được chứa danh mục của sản phẩm áp dụng. Trùng: ${overlap.join(", ")}`
        );
      }
    }

    // 4. Nếu có excludedProducts -> kiểm tra category của chúng không nằm trong categories
    if (excludedProducts.length > 0 && categories.length > 0) {
      const excludedProductDocs = await Product.find({
        _id: { $in: excludedProducts }
      });

      const excludedCategoryIds = excludedProductDocs
        .map((p) => p.category_id?.toString())
        .filter(Boolean);

      const overlap = excludedCategoryIds.filter((catId) =>
        categories.includes(catId)
      );

      if (overlap.length > 0) {
        return responseUtil.badRequestResponse(
          res,
          null,
          `Danh mục áp dụng không được chứa danh mục của sản phẩm bị loại trừ. Trùng: ${overlap.join(", ")}`
        );
      }
    }

    //  Không vi phạm => tạo
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
    const userId = req.user._id;
    const { coupon_code } = req.body;

    logger.info(
      `[CART] POST /carts/coupons - User: ${userId}, Coupon: ${coupon_code}`
    );

    const coupon = await couponService.applyCoupon(coupon_code, userId);

    return responseUtil.successResponse(
      res,
      coupon,
      "Áp dụng mã giảm giá thành công"
    );
  } catch (error) {
    logger.error(`[CART] POST /carts/coupons - Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
      body: req.body,
    });

    if (
      error.message.includes("không tồn tại") ||
      error.message.includes("không hợp lệ") ||
      error.message.includes("hết hạn") ||
      error.message.includes("hết lượt")
    ) {
      return responseUtil.badRequestResponse(res, null, error.message);
    }

    return responseUtil.errorResponse(
      res,
      null,
      error.message,
      error.statusCode || 500
    );
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