import responseUtil from '../utils/response.util.js';
import couponService from '../services/coupon.service.js';
import Product from "../models/product.model.js";
import mongoose from 'mongoose';
import { getAvailableCouponsSchema } from "../validations/coupon.validation.js";
// Tạo coupon mới (Admin)
const createCoupon = async (req, res) => {
  try {
    const {
      products = [],
      excludedProducts = [],
      categories = [],
      excludedCategories = [],
      usageLimit,
      perUserLimit,
      startDate,
      expiryDate,
    } = req.body;

    // 1. Duplicate in same arrays already handled by Joi .unique(), but safe-check:
    const duplicateProducts = products.filter((p) => excludedProducts.includes(p));
    if (duplicateProducts.length > 0) {
      return responseUtil.badRequestResponse(
        res,
        null,
        `Sản phẩm được áp dụng và không được áp dụng không được trùng nhau. Trùng: ${duplicateProducts.join(", ")}`
      );
    }
    const duplicateCategories = categories.filter((c) => excludedCategories.includes(c));
    if (duplicateCategories.length > 0) {
      return responseUtil.badRequestResponse(
        res,
        null,
        `Danh mục được áp dụng và không được áp dụng không được trùng nhau. Trùng: ${duplicateCategories.join(", ")}`
      );
    }

    // 2. Check product ids exist
    const allProductIds = [...new Set([...products, ...excludedProducts])];
    if (allProductIds.length > 0) {
      const foundProducts = await Product.find({ _id: { $in: allProductIds } }).select('_id');
      const foundIds = foundProducts.map(p => p._id.toString());
      const notFound = allProductIds.filter(id => !foundIds.includes(id));
      if (notFound.length > 0) {
        return responseUtil.badRequestResponse(res, null, `Không tìm thấy sản phẩm với id: ${notFound.join(', ')}`);
      }
    }

    // 3. Check category ids exist
    const allCategoryIds = [...new Set([...categories, ...excludedCategories])];
    if (allCategoryIds.length > 0) {
      const foundCategories = await Category.find({ _id: { $in: allCategoryIds } }).select('_id');
      const foundCIds = foundCategories.map(c => c._id.toString());
      const notFoundCats = allCategoryIds.filter(id => !foundCIds.includes(id));
      if (notFoundCats.length > 0) {
        return responseUtil.badRequestResponse(res, null, `Không tìm thấy danh mục với id: ${notFoundCats.join(', ')}`);
      }
    }

    // 4. Nếu có products -> kiểm tra category của chúng không nằm trong excludedCategories
    if (products.length > 0 && excludedCategories.length > 0) {
      const productDocs = await Product.find({ _id: { $in: products } }).select('category_id');
      const categoryIds = productDocs.map((p) => p.category_id?.toString()).filter(Boolean);
      const overlap = categoryIds.filter((catId) => excludedCategories.includes(catId));
      if (overlap.length > 0) {
        return responseUtil.badRequestResponse(
          res,
          null,
          `Danh mục bị loại trừ không được chứa danh mục của sản phẩm áp dụng. Trùng: ${overlap.join(", ")}`
        );
      }
    }

    // 5. Nếu có excludedProducts -> kiểm tra category của chúng không nằm trong categories
    if (excludedProducts.length > 0 && categories.length > 0) {
      const excludedProductDocs = await Product.find({ _id: { $in: excludedProducts } }).select('category_id');
      const excludedCategoryIds = excludedProductDocs.map((p) => p.category_id?.toString()).filter(Boolean);
      const overlap = excludedCategoryIds.filter((catId) => categories.includes(catId));
      if (overlap.length > 0) {
        return responseUtil.badRequestResponse(
          res,
          null,
          `Danh mục áp dụng không được chứa danh mục của sản phẩm bị loại trừ. Trùng: ${overlap.join(", ")}`
        );
      }
    }

    // 6. usageLimit vs perUserLimit
    if (usageLimit !== undefined && usageLimit !== null && perUserLimit > usageLimit) {
      return responseUtil.badRequestResponse(res, null, 'perUserLimit không được lớn hơn usageLimit');
    }

    // 7. expiryDate không ở quá khứ
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return responseUtil.badRequestResponse(res, null, 'expiryDate không được ở quá khứ');
    }

    // 8. Nếu mọi thứ ok => tạo
    const coupon = await couponService.createCoupon(req.body);
    responseUtil.createdResponse(res, coupon, 'Tạo mã giảm giá thành công');
  } catch (error) {
    // 9. Xử lý duplicate key trả 409
    if (error && error.message && error.message.includes('Mã coupon đã tồn tại')) {
      return responseUtil.errorResponse(res, null, error.message, 409);
    }
    responseUtil.errorResponse(res, null, error.message || 'Lỗi server', 400);
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
    let statusCode = 400;
    if (error.message === 'Coupon not found') statusCode = 404;
    if (error.message === 'Mã coupon đã tồn tại') statusCode = 409;
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
const getAvailableCouponsController = async (req, res) => {
  try {
    const userId = req.user._id;

    const { error, value } = getAvailableCouponsSchema.validate(req.query);
    if (error) {
      return responseUtil.validationErrorResponse(res, null, error.details[0].message);
    }

    const { page, limit } = value;

    const coupons = await couponService.getAvailableCoupons(userId, page, limit);

    return responseUtil.successResponse(res, coupons, "Danh sách coupon user được sử dụng.");
  } catch (error) {
    console.error(error);
    return responseUtil.errorResponse(res, null, "Lỗi server khi lấy coupon.");
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
  getAvailableCouponsController,
};