import Joi from 'joi';

const createCategoryPostSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Tên danh mục không được để trống',
      'string.min': 'Tên danh mục phải có ít nhất {#limit} ký tự',
      'string.max': 'Tên danh mục không được vượt quá {#limit} ký tự',
      'any.required': 'Tên danh mục là bắt buộc'
    }),
  slug: Joi.string()
    .trim()
    .lowercase()
    .optional() 
});

const updateCategoryPostSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .messages({
      'string.empty': 'Tên danh mục không được để trống',
      'string.min': 'Tên danh mục phải có ít nhất {#limit} ký tự',
      'string.max': 'Tên danh mục không được vượt quá {#limit} ký tự'
    }),
  slug: Joi.string()
    .trim()
    .lowercase()
    .optional()
}).min(1);

export default {
  createCategoryPostSchema,
  updateCategoryPostSchema,
};