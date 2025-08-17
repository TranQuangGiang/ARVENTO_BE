import Joi from 'joi';

// Validate khi tạo coupon
export const createCouponValidation = Joi.object({
  code: Joi.string().uppercase().trim().pattern(/^[A-Z0-9]+$/).optional(), // optional vì service có thể sinh
  discountType: Joi.string().valid('percentage', 'fixed_amount').required(),
  discountValue: Joi.alternatives().conditional('discountType', {
    is: 'percentage',
    then: Joi.number().min(0.01).max(100).required().messages({
      'number.max': 'Giảm giá phần trăm không được lớn hơn 100%',
      'number.min': 'Giảm giá phải lớn hơn 0',
    }),
    otherwise: Joi.number().min(0.01).required().messages({
      'number.min': 'Giảm giá phải lớn hơn 0'
    }),
  }),
 description: Joi.string().max(500).allow('', null),
  
  // Giới hạn sử dụng
  usageLimit: Joi.number().positive().allow(null),
  perUserLimit: Joi.number().positive().default(1),
  startDate: Joi.date().default(() => new Date()),
  expiryDate: Joi.date().greater(Joi.ref('startDate')).allow(null),
  
  // Điều kiện áp dụng
  minSpend: Joi.number().positive().default(0),
  maxSpend: Joi.number().positive().allow(null),
  products: Joi.array().items(Joi.string().hex().length(24)),
  excludedProducts: Joi.array().items(Joi.string().hex().length(24)),
  categories: Joi.array().items(Joi.string().hex().length(24)),
  excludedCategories: Joi.array().items(Joi.string().hex().length(24)),
  
  // Tùy chọn đặc biệt
  allowFreeShipping: Joi.boolean().default(false),
  excludeSaleItems: Joi.boolean().default(false),
  individualUse: Joi.boolean().default(false),
  userRestrictions: Joi.array().items(Joi.string().hex().length(24)),
  
  isActive: Joi.boolean().default(true),
})
.custom((value, helpers) => {
  // maxSpend vs minSpend
  if (value.maxSpend !== null && value.maxSpend < value.minSpend) {
    return helpers.message('maxSpend phải lớn hơn hoặc bằng minSpend');
  }
  // perUserLimit vs usageLimit
  if (value.usageLimit !== null && value.perUserLimit > value.usageLimit) {
    return helpers.message('perUserLimit không được lớn hơn usageLimit');
  }
  // duplicate product/category between included & excluded (fast-fail)
  if (Array.isArray(value.products) && Array.isArray(value.excludedProducts)) {
    const dupP = value.products.filter(p => value.excludedProducts.includes(p));
    if (dupP.length) return helpers.message(`Sản phẩm nằm trong cả products và excludedProducts: ${dupP.join(', ')}`);
  }
  if (Array.isArray(value.categories) && Array.isArray(value.excludedCategories)) {
    const dupC = value.categories.filter(c => value.excludedCategories.includes(c));
    if (dupC.length) return helpers.message(`Danh mục nằm trong cả categories và excludedCategories: ${dupC.join(', ')}`);
  }

  // expiryDate không ở quá khứ (nếu có)
  if (value.expiryDate && new Date(value.expiryDate) < new Date()) {
    return helpers.message('expiryDate không được ở quá khứ');
  }

  return value;
});

// Validate khi cập nhật coupon
export const updateCouponValidation = Joi.object({
  code: Joi.string().uppercase().trim().pattern(/^[A-Z0-9]+$/),

  discountType: Joi.string().valid('percentage', 'fixed_amount'),
  // Khi update, có thể chỉ gửi value hoặc chỉ gửi type, nên tách rule ở .custom bên dưới
  discountValue: Joi.number().min(0.01),

  description: Joi.string().max(500),

  usageLimit: Joi.number().integer().min(1).allow(null),
  perUserLimit: Joi.number().integer().min(1),

  startDate: Joi.date(),
  expiryDate: Joi.date()
    .allow(null)
    .custom((value, helpers) => {
      const { startDate } = helpers.state.ancestors[0];
      if (value && startDate && new Date(value) <= new Date(startDate)) {
        return helpers.message('expiryDate phải sau startDate');
      }
      return value;
    }),

  minSpend: Joi.number().min(0),
  maxSpend: Joi.number().min(0).allow(null),

  products: Joi.array().items(Joi.string().hex().length(24)).unique(),
  excludedProducts: Joi.array().items(Joi.string().hex().length(24)).unique(),
  categories: Joi.array().items(Joi.string().hex().length(24)).unique(),
  excludedCategories: Joi.array().items(Joi.string().hex().length(24)).unique(),

  allowFreeShipping: Joi.boolean(),
  excludeSaleItems: Joi.boolean(),
  individualUse: Joi.boolean(),
  userRestrictions: Joi.array().items(Joi.string().hex().length(24)).unique(),

  isActive: Joi.boolean(),
})
.custom((value, helpers) => {
  // percentage <= 100 nếu biết được type trong payload
  if (value.discountType === 'percentage' && value.discountValue !== undefined && value.discountValue > 100) {
    return helpers.message('Giảm giá phần trăm không được lớn hơn 100%');
  }

  // maxSpend >= minSpend (nếu cả 2 xuất hiện trong payload)
  if (value.maxSpend !== undefined && value.maxSpend !== null && value.minSpend !== undefined) {
    if (value.maxSpend < value.minSpend) {
      return helpers.message('maxSpend phải lớn hơn hoặc bằng minSpend');
    }
  }

  // perUserLimit <= usageLimit (khi cả 2 có trong payload và usageLimit != null)
  if (value.usageLimit !== undefined && value.usageLimit !== null && value.perUserLimit !== undefined) {
    if (value.perUserLimit > value.usageLimit) {
      return helpers.message('perUserLimit không được lớn hơn usageLimit');
    }
  }

  // Overlap include/exclude
  if (Array.isArray(value.products) && Array.isArray(value.excludedProducts)) {
    const dupP = value.products.filter(p => value.excludedProducts.includes(p));
    if (dupP.length) return helpers.message(`Sản phẩm nằm trong cả products và excludedProducts: ${dupP.join(', ')}`);
  }
  if (Array.isArray(value.categories) && Array.isArray(value.excludedCategories)) {
    const dupC = value.categories.filter(c => value.excludedCategories.includes(c));
    if (dupC.length) return helpers.message(`Danh mục nằm trong cả categories và excludedCategories: ${dupC.join(', ')}`);
  }

  return value;
}).min(1); // Ít nhất 1 trường phải được cập nhật

// Validate khi kiểm tra coupon
export const validateCouponValidation = Joi.object({
  code: Joi.string().required().uppercase().trim(),
  userId: Joi.string().hex().length(24).required(),
  cartTotal: Joi.number().positive().required(),
  productIds: Joi.array().items(Joi.string().hex().length(24)).default([]),
});
export const paramsSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export const bodySchema = Joi.object({
  code: Joi.string().required(),
  discount: Joi.number().min(0).max(100).required(),
  expireDate: Joi.date().optional(),
});

export const querySchema = Joi.object({
  verbose: Joi.boolean(),
});
export const getAvailableCouponsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
export default {
  createCouponValidation,
  updateCouponValidation,
  validateCouponValidation,
  paramsSchema,
  bodySchema,
  querySchema,
};