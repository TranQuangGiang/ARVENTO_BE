import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().required().max(100).messages({
    'string.empty': 'Tên danh mục không được để trống.',
    'string.max': 'Tên danh mục không được vượt quá 100 ký tự.',
    'any.required': 'Tên danh mục là trường bắt buộc.',
  }),
  slug: Joi.string().required().max(100).messages({
    'string.empty': 'Slug danh mục không được để trống.',
    'string.max': 'Slug danh mục không được vượt quá 100 ký tự.',
    'any.required': 'Slug danh mục là trường bắt buộc.',
  }),
  description: Joi.string().allow('').optional().messages({
    'string.base': 'Mô tả phải là một chuỗi.',
  }),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().max(100).optional().messages({
    'string.max': 'Tên danh mục không được vượt quá 100 ký tự.',
  }),
  slug: Joi.string().max(100).optional().messages({
    'string.max': 'Slug danh mục không được vượt quá 100 ký tự.',
  }),
  description: Joi.string().allow('').optional().messages({
    'string.base': 'Mô tả phải là một chuỗi.',
  }),
}).min(1).messages({
  'object.min': 'Vui lòng cung cấp ít nhất một trường để cập nhật.',
});