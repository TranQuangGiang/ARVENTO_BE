
import Joi from 'joi';

const createPostSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(5)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Tiêu đề bài viết không được để trống',
      'string.min': 'Tiêu đề bài viết phải có ít nhất {#limit} ký tự',
      'string.max': 'Tiêu đề bài viết không được vượt quá {#limit} ký tự',
      'any.required': 'Tiêu đề bài viết là bắt buộc'
    }),
  slug: Joi.string()
    .trim()
    .lowercase()
    .optional(), 
  content: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.empty': 'Nội dung bài viết không được để trống',
      'string.min': 'Nội dung bài viết phải có ít nhất {#limit} ký tự',
      'any.required': 'Nội dung bài viết là bắt buộc'
    }),
  excerpt: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Tóm tắt bài viết không được vượt quá {#limit} ký tự'
    }),

  category: Joi.string()
    .hex() 
    .length(24)
    .required()
    .messages({
      'string.empty': 'Danh mục bài viết không được để trống',
      'string.hex': 'ID danh mục không hợp lệ',
      'string.length': 'ID danh mục phải là 24 ký tự',
      'any.required': 'Danh mục bài viết là bắt buộc'
    }),
  tags: Joi.array()
    .items(Joi.string().trim().max(50))
    .optional()
    .messages({
      'array.base': 'Thẻ phải là một mảng các chuỗi',
      'string.max': 'Mỗi thẻ không được vượt quá {#limit} ký tự'
    }),
  status: Joi.string()
    .valid('draft', 'published', 'archived')
    .optional()
    .default('draft')
    .messages({
      'any.only': 'Trạng thái bài viết không hợp lệ. Chỉ chấp nhận "draft", "published" hoặc "archived".'
    }),
  viewCount: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0),
  publishedAt: Joi.date()
    .optional()
});

const updatePostSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(5)
    .max(255)
    .messages({
      'string.empty': 'Tiêu đề bài viết không được để trống',
      'string.min': 'Tiêu đề bài viết phải có ít nhất {#limit} ký tự',
      'string.max': 'Tiêu đề bài viết không được vượt quá {#limit} ký tự'
    }),
  slug: Joi.string()
    .trim()
    .lowercase()
    .optional(),
  content: Joi.string()
    .min(10)
    .messages({
      'string.empty': 'Nội dung bài viết không được để trống',
      'string.min': 'Nội dung bài viết phải có ít nhất {#limit} ký tự'
    }),
  excerpt: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Tóm tắt bài viết không được vượt quá {#limit} ký tự'
    }),
  category: Joi.string()
    .hex()
    .length(24)
    .messages({
      'string.hex': 'ID danh mục không hợp lệ',
      'string.length': 'ID danh mục phải là 24 ký tự'
    }),
  tags: Joi.array()
    .items(Joi.string().trim().max(50))
    .optional()
    .messages({
      'array.base': 'Thẻ phải là một mảng các chuỗi',
      'string.max': 'Mỗi thẻ không được vượt quá {#limit} ký tự'
    }),
  status: Joi.string()
    .valid('draft', 'published', 'archived')
    .optional()
    .messages({
      'any.only': 'Trạng thái bài viết không hợp lệ. Chỉ chấp nhận "draft", "published" hoặc "archived".'
    }),
  viewCount: Joi.number()
    .integer()
    .min(0)
    .optional(),
  publishedAt: Joi.date()
    .optional()
}).min(1); 

export default {
  createPostSchema,
  updatePostSchema,
};