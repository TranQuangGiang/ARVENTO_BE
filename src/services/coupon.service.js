import Coupon from '../models/coupon.model.js';
import CouponUsage from '../models/couponUsage.model.js';
import parseQueryParams from '../utils/queryParser.util.js';
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

// Cập nhật coupon
const updateCoupon = async (couponId, updateData) => {
  const coupon = await Coupon.findByIdAndUpdate(couponId, updateData, {
    new: true,
    runValidators: true,
  });
  if (!coupon) {
    throw new Error('Coupon not found');
  }
  return coupon;
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
  const coupon = await Coupon.findOne({ code });
  
  if (!coupon) {
    throw new Error('Mã giảm giá không tồn tại');
  }
  
  // Kiểm tra trạng thái active
  if (!coupon.isActive) {
    throw new Error('Mã giảm giá không còn hiệu lực');
  }
  
  // Kiểm tra thời gian hiệu lực
  const now = new Date();
  if (coupon.startDate > now) {
    throw new Error('Mã giảm giá chưa có hiệu lực');
  }
  
  if (coupon.expiryDate && coupon.expiryDate < now) {
    throw new Error('Mã giảm giá đã hết hạn');
  }
  
  // Kiểm tra giới hạn sử dụng
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw new Error('Mã giảm giá đã hết lượt sử dụng');
  }
  
  // Kiểm tra giới hạn sử dụng của user
  const usage = await CouponUsage.findOne({ user: userId, coupon: coupon._id });
  if (usage && usage.usageCount >= coupon.perUserLimit) {
    throw new Error('Bạn đã sử dụng hết lượt cho mã giảm giá này');
  }
  
  // Kiểm tra giá trị đơn hàng tối thiểu
  if (cartTotal < coupon.minSpend) {
    throw new Error(`Đơn hàng tối thiểu phải từ ${coupon.minSpend}đ để áp dụng mã giảm giá`);
  }
  
  // Kiểm tra giá trị đơn hàng tối đa
  if (coupon.maxSpend && cartTotal > coupon.maxSpend) {
    throw new Error(`Đơn hàng tối đa phải dưới ${coupon.maxSpend}đ để áp dụng mã giảm giá`);
  }
  
  // Kiểm tra sản phẩm áp dụng
if (coupon.products.length > 0) {
  const couponProductIds = coupon.products.map(id => id.toString());
  const validProducts = productIds.some(id => couponProductIds.includes(id.toString()));
  if (!validProducts) {
    throw new Error('Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng');
  }
}

// Kiểm tra sản phẩm bị loại trừ
if (coupon.excludedProducts.length > 0) {
  const excludedProductIds = coupon.excludedProducts.map(id => id.toString());
  const hasExcluded = productIds.some(id => excludedProductIds.includes(id.toString()));
  if (hasExcluded) {
    throw new Error('Mã giảm giá không áp dụng cho một số sản phẩm trong giỏ hàng');
  }
}

  
  // Kiểm tra danh mục áp dụng
  if (coupon.categories && coupon.categories.length > 0) {
    // Lấy danh sách category_id của tất cả sản phẩm trong giỏ hàng
    const products = await Product.find({ _id: { $in: productIds } });
    const productCategoryIds = products.map(p => p.category_id.toString());
    
    // Kiểm tra có ít nhất một sản phẩm thuộc danh mục áp dụng
    const hasValidCategory = productCategoryIds.some(catId => 
      coupon.categories.includes(catId)
    );
    
    if (!hasValidCategory) {
      throw new Error('Mã giảm giá chỉ áp dụng cho sản phẩm thuộc danh mục nhất định');
    }
  }

  // Kiểm tra danh mục bị loại trừ
  if (coupon.excludedCategories && coupon.excludedCategories.length > 0) {
    const products = await Product.find({ _id: { $in: productIds } });
    const productCategoryIds = products.map(p => p.category_id.toString());
    
    // Kiểm tra có sản phẩm nào thuộc danh mục bị loại trừ
    const hasExcludedCategory = productCategoryIds.some(catId => 
      coupon.excludedCategories.includes(catId)
    );
    
    if (hasExcludedCategory) {
      throw new Error('Mã giảm giá không áp dụng cho sản phẩm thuộc danh mục bị loại trừ');
    }
  }
  
  // Kiểm tra các điều kiện khác
  if (coupon.userRestrictions.length > 0 && !coupon.userRestrictions.includes(userId)) {
    throw new Error('Bạn không đủ điều kiện sử dụng mã giảm giá này');
  }
  
  let discountAmount = 0;
if (coupon.discountType === 'percentage') {
  discountAmount = (cartTotal * coupon.discountValue) / 100;
  if (coupon.maxSpend && discountAmount > coupon.maxSpend) {
    discountAmount = coupon.maxSpend;
  }
} else {
  discountAmount = coupon.discountValue;
}

// Giới hạn discountAmount không được lớn hơn cartTotal
if (discountAmount > cartTotal) {
  discountAmount = cartTotal;
}

return {
  isValid: true,
  coupon: coupon.toObject(),
  discountAmount,
  finalAmount: cartTotal - discountAmount,
};
};

// Áp dụng coupon (tăng số lượt sử dụng)
const applyCoupon = async (code, userId) => {
  const coupon = await Coupon.findOne({ code });
  if (!coupon) throw new Error('Mã giảm giá không tồn tại');

  
  // Tăng số lượt sử dụng tổng
  coupon.usageCount += 1;
  await coupon.save();
  
  // Cập nhật số lượt sử dụng của user
  await CouponUsage.findOneAndUpdate(
    { user: userId, coupon: coupon._id },
    { $inc: { usageCount: 1 } },
    { upsert: true, new: true }
  );
  
  return coupon;
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