import Joi from 'joi';

const createSchema = Joi.object({
  title: Joi.string().required().max(255).messages({
    'string.empty': 'Tiêu đề không được để trống',
    'string.max': 'Tiêu đề không được vượt quá 255 ký tự',
    'any.required': 'Tiêu đề là bắt buộc'
  }),
  slug: Joi.string().required().messages({
    'string.empty': 'Slug không được để trống',
    'any.required': 'Slug là bắt buộc'
  }),
  content: Joi.string().required().messages({
    'string.empty': 'Nội dung không được để trống',
    'any.required': 'Nội dung là bắt buộc'
  }),
  excerpt: Joi.string().max(500).allow('').messages({
    'string.max': 'Tóm tắt không được vượt quá 500 ký tự'
  }),
  category: Joi.string().max(100).allow('').messages({
    'string.max': 'Category không được vượt quá 100 ký tự'
  }),
  category_name: Joi.string().max(100).allow('').messages({
    'string.max': 'Tên chuyên mục không được vượt quá 100 ký tự'
  }),
  tags: Joi.array().items(Joi.string().max(50)).messages({
    'string.max': 'Mỗi tag không được vượt quá 50 ký tự'
  }),
  status: Joi.string().valid('draft', 'published', 'archived').messages({
    'any.only': 'Trạng thái phải là draft, published hoặc archived'
  }),
  author: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Author ID không hợp lệ'
  })
});

const updateSchema = createSchema.fork(['title', 'slug', 'content'], (schema) => schema.optional());

const categorySchema = Joi.object({
  category: Joi.string().required().max(100).messages({
    'string.empty': 'Category không được để trống',
    'any.required': 'Category là bắt buộc',
    'string.max': 'Category không được vượt quá 100 ký tự'
  }),
  category_name: Joi.string().max(100).allow('').messages({
    'string.max': 'Tên chuyên mục không được vượt quá 100 ký tự'
  })
});

export default {
  createSchema,
  updateSchema,
  categorySchema
};
