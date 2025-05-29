import Joi from 'joi';
import mongoose from 'mongoose';

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const variant = Joi.object({
  size: Joi.string().max(10).messages({
    'string.max': 'Kích cỡ không được dài quá 10 ký tự',
  }),
  color: Joi.string().max(50).messages({
    'string.max': 'Màu sắc không được dài quá 50 ký tự',
  }),
  stock: Joi.number().integer().min(0).messages({
    'number.base': 'Số lượng tồn kho biến thể phải là số nguyên',
    'number.min': 'Số lượng tồn kho biến thể không được nhỏ hơn 0',
  }),
});

export const create = Joi.object({
  category_id: Joi.string().custom(objectIdValidator, 'ObjectId validation').required().messages({
    'any.required': 'category_id là bắt buộc',
    'any.invalid': 'category_id không hợp lệ',
    'string.empty': 'category_id không được để trống',
  }),
  name: Joi.string().max(150).required().messages({
    'string.empty': 'Tên sản phẩm không được để trống',
    'string.max': 'Tên sản phẩm không được dài quá 150 ký tự',
  }),
  slug: Joi.string().max(150).required().messages({
    'string.empty': 'Slug không được để trống',
    'string.max': 'Slug không được dài quá 150 ký tự',
  }),
  description: Joi.string().allow(''),
  price: Joi.number().positive().required().messages({
    'number.base': 'Giá phải là số',
    'number.positive': 'Giá phải lớn hơn 0',
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'Số lượng tồn kho phải là số nguyên',
    'number.min': 'Số lượng tồn kho không được nhỏ hơn 0',
  }),
  images: Joi.array().items(Joi.string().uri()),
  variants: Joi.array().items(variant),
  tags: Joi.array().items(Joi.string()),
});

export const update = Joi.object({
  category_id: Joi.string().custom(objectIdValidator, 'ObjectId validation').messages({
    'any.invalid': 'category_id không hợp lệ',
    'string.empty': 'category_id không được để trống',
  }),
  name: Joi.string().max(150).messages({
    'string.max': 'Tên sản phẩm không được dài quá 150 ký tự',
  }),
  slug: Joi.string().max(150).messages({
    'string.max': 'Slug không được dài quá 150 ký tự',
  }),
  description: Joi.string().allow(''),
  price: Joi.number().positive().messages({
    'number.base': 'Giá phải là số',
    'number.positive': 'Giá phải lớn hơn 0',
  }),
  stock: Joi.number().integer().min(0).messages({
    'number.base': 'Số lượng tồn kho phải là số nguyên',
    'number.min': 'Số lượng tồn kho không được nhỏ hơn 0',
  }),
  images: Joi.array().items(Joi.string().uri()),
  variants: Joi.array().items(variant),
  tags: Joi.array().items(Joi.string()),
}).min(1);  

export default {
  create,
  update,
};