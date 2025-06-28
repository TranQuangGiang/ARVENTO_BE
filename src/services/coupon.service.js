import Coupon from '../models/coupon.model.js';
import CouponUsage from '../models/couponUsage.model.js';
import parseQueryParams from '../utils/queryParser.util.js';
import Cart from "../models/cart.model.js";
// import cartService from "../services/cart.service.js";
// Tạo coupon mới
const createCoupon = async (couponData) => {
  if (!couponData.code) {
    couponData.code = generateRandomCode(8); // Tạo mã ngẫu nhiên 8 ký tự nếu không nhập
  }
  
  const coupon = await Coupon.create(couponData);
  return coupon;
};

// Lấy tất cả coupon (cho admin)
const getAllCoupons = async (queryParams) => {
  const allowedFields = {
    code: 'string',
    discountType: 'exact',
    isActive: 'boolean',
  };
  
  const { filters, sort, page, limit } = parseQueryParams(queryParams, allowedFields);
  
  const coupons = await Coupon.find(filters)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
    
  const total = await Coupon.countDocuments(filters);
  
  return {
    coupons,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// Lấy coupon theo ID
const getCouponById = async (couponId) => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    throw new Error('Coupon not found');
  }
  return coupon;
};
//cập nhật coupon
const updateCoupon = async (couponId, updateData) => {
  const existingCoupon = await Coupon.findById(couponId);
  if (!existingCoupon) {
    throw new Error('Coupon not found');
  }

  const startDate = existingCoupon.startDate;
  const expiryDate = updateData.expiryDate;

  if (expiryDate && startDate && new Date(expiryDate) <= new Date(startDate)) {
    throw new Error('Ngày hết hạn phải sau ngày bắt đầu');
  }

  const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, updateData, {
    new: true,
    runValidators: true,
  });

  return updatedCoupon;
};


// Xóa coupon
const deleteCoupon = async (couponId) => {
  const coupon = await Coupon.findByIdAndDelete(couponId);
  if (!coupon) {
    throw new Error('Coupon not found');
  }
  return coupon;
};

// Kiểm tra coupon có hợp lệ không
const validateCoupon = async (code, userId, cartTotal, productIds = []) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon) {
    throw new Error("Mã giảm giá không tồn tại");
  }

  if (!coupon.isActive) {
    throw new Error("Mã giảm giá không còn hiệu lực");
  }

  const now = new Date();

  if (coupon.startDate && coupon.startDate > now) {
    throw new Error("Mã giảm giá chưa có hiệu lực");
  }

  if (coupon.expiryDate && coupon.expiryDate < now) {
    throw new Error("Mã giảm giá đã hết hạn");
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw new Error("Mã giảm giá đã hết lượt sử dụng");
  }

  if (coupon.perUserLimit) {
    const usage = await CouponUsage.findOne({
      user: userId,
      coupon: coupon._id,
    });

    if (usage && usage.usageCount >= coupon.perUserLimit) {
      throw new Error("Bạn đã sử dụng hết lượt cho mã giảm giá này");
    }
  }

  if (coupon.minSpend && cartTotal < coupon.minSpend) {
    throw new Error(
      `Đơn hàng tối thiểu phải từ ${coupon.minSpend}đ để áp dụng mã giảm giá`
    );
  }

  if (coupon.maxSpend && cartTotal > coupon.maxSpend) {
    throw new Error(
      `Đơn hàng tối đa phải dưới ${coupon.maxSpend}đ để áp dụng mã giảm giá`
    );
  }

  if (coupon.products?.length > 0) {
    const couponProductIds = coupon.products.map((id) => id.toString());
    const hasValidProduct = productIds.some((id) =>
      couponProductIds.includes(id.toString())
    );
    if (!hasValidProduct) {
      throw new Error(
        "Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng"
      );
    }
  }

  if (coupon.excludedProducts?.length > 0) {
    const excludedProductIds = coupon.excludedProducts.map((id) =>
      id.toString()
    );
    const hasExcluded = productIds.some((id) =>
      excludedProductIds.includes(id.toString())
    );
    if (hasExcluded) {
      throw new Error(
        "Mã giảm giá không áp dụng cho một số sản phẩm trong giỏ hàng"
      );
    }
  }

  if (coupon.categories?.length > 0) {
    const products = await Product.find({ _id: { $in: productIds } });
    const categoryIds = products.map((p) => p.category_id?.toString());
    const hasValidCategory = categoryIds.some((catId) =>
      coupon.categories.includes(catId)
    );
    if (!hasValidCategory) {
      throw new Error(
        "Mã giảm giá chỉ áp dụng cho sản phẩm thuộc danh mục nhất định"
      );
    }
  }

  if (coupon.excludedCategories?.length > 0) {
    const products = await Product.find({ _id: { $in: productIds } });
    const categoryIds = products.map((p) => p.category_id?.toString());
    const hasExcludedCategory = categoryIds.some((catId) =>
      coupon.excludedCategories.includes(catId)
    );
    if (hasExcludedCategory) {
      throw new Error(
        "Mã giảm giá không áp dụng cho sản phẩm thuộc danh mục bị loại trừ"
      );
    }
  }

  if (
    coupon.userRestrictions?.length > 0 &&
    !coupon.userRestrictions.includes(userId)
  ) {
    throw new Error("Bạn không đủ điều kiện sử dụng mã giảm giá này");
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = (cartTotal * coupon.discountValue) / 100;

    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  if (discountAmount > cartTotal) {
    discountAmount = cartTotal;
  }

  const finalAmount = cartTotal - discountAmount;

  return {
  isValid: true,
  coupon,
  discountAmount,
  finalAmount,
};
};
const applyCoupon = async (code, userId, subtotal, productIds) => {
  const { coupon } = await validateCoupon(code, userId, subtotal, productIds);

  coupon.usageCount += 1;
  await coupon.save();

  await CouponUsage.findOneAndUpdate(
    { user: userId, coupon: coupon._id },
    { $inc: { usageCount: 1 } },
    { upsert: true, new: true }
  );

  let discountAmount = 0;

 if (coupon.discountType === "fixed_amount") {
  discountAmount = coupon.discountValue;
  } else if (coupon.discountType === "percentage") {
    discountAmount = (subtotal * coupon.discountValue) / 100;
  }

  const finalAmount = subtotal - discountAmount < 0 ? 0 : subtotal - discountAmount;

  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    await cart.applyCoupon(
      coupon.code,
      discountAmount,
      coupon.discountType
    );
  }

  return {
    coupon,
    discountAmount,
    finalAmount,
    isValid: true,
  };
};




// Ghi lại lịch sử sử dụng mã
const recordCouponUsage = async (couponId, userId) => {
  await CouponUsage.findOneAndUpdate(
    { coupon: couponId, user: userId },
    { $inc: { usageCount: 1 } },
    { upsert: true, new: true }
  );
};

// Lấy lịch sử sử dụng mã
const getCouponUsageHistory = async (couponId) => {
  const history = await CouponUsage.find({ coupon: couponId })
    .populate('user', 'name email')
    .sort({ updatedAt: -1 });

  return history;
};
//bật tắt

const toggleCouponStatus = async (id) => {
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new Error('NOT_FOUND');

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return coupon;
  } catch (err) {
    console.error('Lỗi trong service toggleCouponStatus:', err);
    throw err;
  }
};

export default {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  recordCouponUsage,
  getCouponUsageHistory,
  toggleCouponStatus,
};