import Coupon from "../models/coupon.model.js";
import Product from "../models/product.model.js";
import CouponUsage from "../models/couponUsage.model.js";
import parseQueryParams from "../utils/queryParser.util.js";
import logger from "../config/logger.config.js";
import { generateRandomCode } from "../utils/response.util.js";
console.log("[DEBUG] Product model:", Product);
// Tạo coupon mới
const createCoupon = async (couponData) => {
  if (!couponData.code) {
    couponData.code = generateRandomCode(8);
  }

  const coupon = await Coupon.create(couponData);
  return coupon;
};

// Lấy tất cả coupon (cho admin)
const getAllCoupons = async (queryParams) => {
  const allowedFields = {
    code: "string",
    discountType: "exact",
    isActive: "boolean",
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
    throw new Error("Coupon not found");
  }
  return coupon;
};
//cập nhật coupon
const updateCoupon = async (couponId, updateData) => {
  const existingCoupon = await Coupon.findById(couponId);
  if (!existingCoupon) {
    throw new Error("Coupon not found");
  }

  const startDate = existingCoupon.startDate;
  const expiryDate = updateData.expiryDate;

  if (expiryDate && startDate && new Date(expiryDate) <= new Date(startDate)) {
    throw new Error("Ngày hết hạn phải sau ngày bắt đầu");
  }

  // ------------------------------
  // Validate logic mới
  // ------------------------------

  // Sử dụng dữ liệu mới nếu có, nếu không dùng giá trị cũ
  const products = (updateData.products || existingCoupon.products || []).map((id) => id.toString());
  const excludedProducts = (updateData.excludedProducts || existingCoupon.excludedProducts || []).map((id) => id.toString());
  const categories = (updateData.categories || existingCoupon.categories || []).map((id) => id.toString());
  const excludedCategories = (updateData.excludedCategories || existingCoupon.excludedCategories || []).map((id) => id.toString());

  // 1. products vs excludedProducts không được trùng nhau
  const commonProducts = products.filter((id) => excludedProducts.includes(id));
  if (commonProducts.length > 0) {
    throw new Error("Sản phẩm được áp dụng và không được áp dụng không được trùng nhau.");
  }

  // 2. categories vs excludedCategories không được trùng nhau
  const commonCategories = categories.filter((id) => excludedCategories.includes(id));
  if (commonCategories.length > 0) {
    throw new Error("Danh mục được áp dụng và không được áp dụng không được trùng nhau.");
  }

  // 3. products không được có category nằm trong excludedCategories
  if (products.length > 0 && excludedCategories.length > 0) {
    const appliedProducts = await Product.find({ _id: { $in: products } });
    for (const product of appliedProducts) {
      const catId = product.category_id?.toString();
      if (excludedCategories.includes(catId)) {
        throw new Error(`Sản phẩm ${product._id} thuộc danh mục ${catId} bị loại trừ trong coupon.`);
      }
    }
  }

  // 4. excludedProducts không được có category nằm trong categories
  if (excludedProducts.length > 0 && categories.length > 0) {
    const excludedProds = await Product.find({ _id: { $in: excludedProducts } });
    for (const product of excludedProds) {
      const catId = product.category_id?.toString();
      if (categories.includes(catId)) {
        throw new Error(`Sản phẩm ${product._id} bị loại trừ nhưng lại thuộc danh mục ${catId} được áp dụng trong coupon.`);
      }
    }
  }

  // ------------------------------

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
    throw new Error("Coupon not found");
  }
  return coupon;
};

// Kiểm tra coupon có hợp lệ không
const validateCoupon = async (code, userId, cartTotal, productIds = []) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon) {
    throw new Error("Mã giảm giá không tồn tại");
  }

  // =========================
  // 1. Kiểm tra products vs excludedProducts
  // =========================
  const productIdsStr = (coupon.products || []).map((id) => id.toString());
  const excludedProductIdsStr = (coupon.excludedProducts || []).map((id) => id.toString());
  const commonProducts = productIdsStr.filter((id) => excludedProductIdsStr.includes(id));
  if (commonProducts.length > 0) {
    throw new Error("Sản phẩm được áp dụng và không được áp dụng không được trùng nhau.");
  }

  // =========================
  // 2. Kiểm tra categories vs excludedCategories
  // =========================
  const categoryIdsStr = (coupon.categories || []).map((id) => id.toString());
  const excludedCategoryIdsStr = (coupon.excludedCategories || []).map((id) => id.toString());
  const commonCategories = categoryIdsStr.filter((id) => excludedCategoryIdsStr.includes(id));
  if (commonCategories.length > 0) {
    throw new Error("Danh mục được áp dụng và không được áp dụng không được trùng nhau.");
  }

  // =========================
  // 3. Nếu có products, không được có category bị loại trừ
  // =========================
  if (productIdsStr.length > 0 && excludedCategoryIdsStr.length > 0) {
    const appliedProducts = await Product.find({ _id: { $in: productIdsStr } });
    for (const product of appliedProducts) {
      const catId = product.category_id?.toString();
      if (excludedCategoryIdsStr.includes(catId)) {
        throw new Error(`Sản phẩm ${product._id} thuộc danh mục ${catId} bị loại trừ trong coupon.`);
      }
    }
  }

  // =========================
  // 4. Nếu có excludedProducts, không được nằm trong categories được áp dụng
  // =========================
  if (excludedProductIdsStr.length > 0 && categoryIdsStr.length > 0) {
    const excludedProducts = await Product.find({ _id: { $in: excludedProductIdsStr } });
    for (const product of excludedProducts) {
      const catId = product.category_id?.toString();
      if (categoryIdsStr.includes(catId)) {
        throw new Error(`Sản phẩm ${product._id} bị loại trừ nhưng lại thuộc danh mục ${catId} được áp dụng trong coupon.`);
      }
    }
  }

  // =========================
  // Tiếp tục validate như cũ
  // =========================

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
    throw new Error(`Đơn hàng tối thiểu phải từ ${coupon.minSpend}đ để áp dụng mã giảm giá`);
  }

  if (coupon.maxSpend && cartTotal > coupon.maxSpend) {
    throw new Error(`Đơn hàng tối đa phải dưới ${coupon.maxSpend}đ để áp dụng mã giảm giá`);
  }

  if (coupon.products?.length > 0) {
    const couponProductIds = coupon.products.map((id) => id.toString());
    console.log("----[DEBUG] validateCoupon----");
    console.log("coupon.products:", couponProductIds);
    console.log(
      "payload productIds:",
      productIds.map((id) => id?.toString())
    );

    const hasValidProduct = productIds.some((id) => couponProductIds.includes(id.toString()));
    console.log("hasValidProduct?", hasValidProduct);
    if (!hasValidProduct) {
      throw new Error("Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng");
    }
  }

  if (coupon.excludedProducts?.length > 0) {
    const excludedProductIds = coupon.excludedProducts.map((id) => id.toString());
    const hasExcluded = productIds.some((id) => excludedProductIds.includes(id.toString()));
    if (hasExcluded) {
      throw new Error("Mã giảm giá không áp dụng cho một số sản phẩm trong giỏ hàng");
    }
  }

  if (coupon.categories?.length > 0) {
    const products = await Product.find({ _id: { $in: productIds } });
    const categoryIds = products.map((p) => p.category_id?.toString()).filter(Boolean);
    const hasValidCategory = categoryIds.some((catId) => coupon.categories.includes(catId));
    if (!hasValidCategory) {
      throw new Error("Mã giảm giá chỉ áp dụng cho sản phẩm thuộc danh mục nhất định");
    }
  }

  if (coupon.excludedCategories?.length > 0) {
    const products = await Product.find({ _id: { $in: productIds } });
    const categoryIds = products.map((p) => p.category_id?.toString()).filter(Boolean);
    const hasExcludedCategory = categoryIds.some((catId) => coupon.excludedCategories.includes(catId));
    if (hasExcludedCategory) {
      throw new Error("Mã giảm giá không áp dụng cho sản phẩm thuộc danh mục bị loại trừ");
    }
  }

  if (coupon.userRestrictions?.length > 0 && !coupon.userRestrictions.includes(userId)) {
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

  logger.info(`[PREVIEW COUPON] User: ${userId} | Code: ${coupon.code}`);
  logger.info(`[PREVIEW COUPON] Type: ${coupon.discountType} | Value: ${coupon.discountValue}`);

  let discountAmount = 0;

  if (coupon.discountType === "fixed_amount") {
    discountAmount = coupon.discountValue;
  } else if (coupon.discountType === "percentage") {
    discountAmount = (subtotal * coupon.discountValue) / 100;
  }

  discountAmount = Math.min(discountAmount, subtotal);
  const finalAmount = subtotal - discountAmount;

  return {
    coupon: {
      code: coupon.code,
      discount_type: coupon.discountType,
      discount_value: coupon.discountValue,
    },
    discountAmount,
    finalAmount,
    isValid: true,
  };
};

// Ghi lại lịch sử sử dụng mã
const recordCouponUsage = async (couponId, userId) => {
  await CouponUsage.findOneAndUpdate({ coupon: couponId, user: userId }, { $inc: { usageCount: 1 } }, { upsert: true, new: true });
};

// Lấy lịch sử sử dụng mã
const getCouponUsageHistory = async (couponId) => {
  const history = await CouponUsage.find({ coupon: couponId }).populate("user", "name email").sort({ updatedAt: -1 });

  return history;
};
//bật tắt

const toggleCouponStatus = async (id) => {
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new Error("NOT_FOUND");

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return coupon;
  } catch (err) {
    console.error("Lỗi trong service toggleCouponStatus:", err);
    throw err;
  }
};
const getAvailableCoupons = async (userId, page = 1, limit = 20) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    $and: [
      {
        $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
      },
      {
        $or: [{ usageLimit: null }, { $expr: { $lt: ["$usageCount", "$usageLimit"] } }],
      },
      {
        $or: [{ userRestrictions: { $size: 0 } }, { userRestrictions: userId }],
      },
    ],
  })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const result = [];

  for (const coupon of coupons) {
    if (coupon.perUserLimit) {
      const usage = await CouponUsage.findOne({
        user: userId,
        coupon: coupon._id,
      });

      if (usage && usage.usageCount >= coupon.perUserLimit) {
        continue;
      }
    }

    result.push({
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      description: coupon.description,
      expiryDate: coupon.expiryDate,
    });
  }

  return result;
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
  getAvailableCoupons,
};
