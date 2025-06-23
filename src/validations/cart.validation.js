// === validations/cart.validation.js ===
import Joi from 'joi';

// Validation cho thêm sản phẩm vào giỏ
export const addToCartSchema = Joi.object({
  product_id: Joi.string().hex().length(24).required().messages({
    'any.required': 'Thiếu product_id',
    'string.hex': 'product_id không hợp lệ'
  }),
  variant_id: Joi.string().hex().length(24).required().messages({
    'any.required': 'Thiếu variant_id',
    'string.hex': 'variant_id không hợp lệ'
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'any.required': 'Thiếu quantity',
    'number.min': 'Số lượng tối thiểu là 1'
  })
});

// Validation cho cập nhật số lượng
export const updateCartSchema = Joi.object({
  product_id: Joi.string().hex().length(24).required(),
  variant_id: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).required()
});

// Validation xoá sản phẩm khỏi giỏ
export const removeFromCartSchema = Joi.object({
  product_id: Joi.string().hex().length(24).required(),
  variant_id: Joi.string().hex().length(24).required()
});

// Validation áp mã giảm giá
export const applyCouponSchema = Joi.object({
  code: Joi.string().trim().required().messages({
    'any.required': 'Mã giảm giá không được để trống'
  })
});
