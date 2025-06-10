import Joi from 'joi';

// Validate khi tạo coupon
export const createCouponValidation = Joi.object({
  code: Joi.string().required().uppercase().trim().pattern(/^[A-Z0-9]+$/),
  discountType: Joi.string().valid('percentage', 'fixed_amount').required(),
  discountValue: Joi.number().positive().required(),
  description: Joi.string().max(500),
  
  // Giới hạn sử dụng
  usageLimit: Joi.number().positive().allow(null),
  perUserLimit: Joi.number().positive().default(1),
  startDate: Joi.date().default(Date.now),
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
});

// Validate khi cập nhật coupon
export const updateCouponValidation = Joi.object({
  code: Joi.string().uppercase().trim().pattern(/^[A-Z0-9]+$/),
  discountType: Joi.string().valid('percentage', 'fixed_amount'),
  discountValue: Joi.number().positive(),
  description: Joi.string().max(500),
  
  usageLimit: Joi.number().positive().allow(null),
  perUserLimit: Joi.number().positive(),
  startDate: Joi.date(),
  expiryDate: Joi.date().greater(Joi.ref('startDate')).allow(null),
  
  minSpend: Joi.number().positive(),
  maxSpend: Joi.number().positive().allow(null),
  products: Joi.array().items(Joi.string().hex().length(24)),
  excludedProducts: Joi.array().items(Joi.string().hex().length(24)),
  categories: Joi.array().items(Joi.string().hex().length(24)),
  excludedCategories: Joi.array().items(Joi.string().hex().length(24)),
  
  allowFreeShipping: Joi.boolean(),
  excludeSaleItems: Joi.boolean(),
  individualUse: Joi.boolean(),
  userRestrictions: Joi.array().items(Joi.string().hex().length(24)),
  
  isActive: Joi.boolean(),
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
export default {
  createCouponValidation,
  updateCouponValidation,
  validateCouponValidation,
  paramsSchema,
  bodySchema,
  querySchema,
};