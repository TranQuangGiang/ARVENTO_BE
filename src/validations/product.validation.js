import Joi from 'joi';
import mongoose from 'mongoose';

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const fileSchema = Joi.object({
  fieldname: Joi.string().required(),
  originalname: Joi.string().required(),
  encoding: Joi.string().required(),
  mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/webp').required().messages({
    'any.only': 'Chỉ chấp nhận file ảnh định dạng JPEG, PNG hoặc WEBP'
  }),
  destination: Joi.string().required(),
  filename: Joi.string().required(),
  path: Joi.string().required(),
  size: Joi.number().max(5242880).required().messages({
    'number.max': 'Kích thước file không được vượt quá 5MB'
  })
});

const imageValidation = Joi.alternatives().try(
  Joi.string().uri().messages({
    'string.uri': 'Đường dẫn ảnh không hợp lệ'
  }),
  fileSchema
);

const variant = Joi.object({
  size: Joi.string().max(10).messages({
    'string.max': 'Kích cỡ không được dài quá 10 ký tự'
  }),
  image: imageValidation,

  color: Joi.string().max(50).messages({
    'string.max': 'Màu sắc không được dài quá 50 ký tự'
  }),
  stock: Joi.number().integer().min(0).messages({
    'number.base': 'Số lượng tồn kho biến thể phải là số nguyên',
    'number.min': 'Số lượng tồn kho biến thể không được nhỏ hơn 0'
  })
});

export const create = Joi.object({
  category_id: Joi.string().custom(objectIdValidator, 'ObjectId validation').required().messages({
    'any.required': 'category_id là bắt buộc',
    'any.invalid': 'category_id không hợp lệ',
    'string.empty': 'category_id không được để trống'
  }),
  product_code: Joi.string().required().max(50).messages({
    'any.required': 'Mã sản phẩm là bắt buộc',
    'string.empty': 'Mã sản phẩm không được để trống',
    'string.max': 'Mã sản phẩm không được dài quá 50 ký tự'
  }),
  name: Joi.string().max(150).required().messages({
    'string.empty': 'Tên sản phẩm không được để trống',
    'string.max': 'Tên sản phẩm không được dài quá 150 ký tự'
  }),
  slug: Joi.string().max(150).messages({
    'string.max': 'Slug không được dài quá 150 ký tự'
  }),
  description: Joi.string().allow(''),
  original_price: Joi.number().positive().required().messages({
    'number.base': 'Giá gốc phải là số',
    'number.positive': 'Giá gốc phải lớn hơn 0',
    'any.required': 'Giá gốc là bắt buộc'
  }),
  sale_price: Joi.number().positive().max(Joi.ref('original_price')).messages({
    'number.base': 'Giá khuyến mãi phải là số',
    'number.positive': 'Giá khuyến mãi phải lớn hơn 0',
    'number.max': 'Giá khuyến mãi không được lớn hơn giá gốc'
  }),
 images: Joi.array().items(imageValidation).messages({
  'array.base': 'TEST_LOG - Mảng ảnh không hợp lệ'
}),

  variants: Joi.array().items(variant).max(10).messages({
    'array.max': 'Không được thêm quá 10 biến thể cho sản phẩm'
  }),
  tags: Joi.array().items(Joi.string())
});

export const update = Joi.object({
  category_id: Joi.string().custom(objectIdValidator, 'ObjectId validation').messages({
    'any.invalid': 'category_id không hợp lệ',
    'string.empty': 'category_id không được để trống'
  }),
  product_code: Joi.string().max(50).messages({
    'string.max': 'Mã sản phẩm không được dài quá 50 ký tự'
  }),
  name: Joi.string().max(150).messages({
    'string.max': 'Tên sản phẩm không được dài quá 150 ký tự'
  }),
  slug: Joi.string().max(150).messages({
    'string.max': 'Slug không được dài quá 150 ký tự'
  }),
  description: Joi.string().allow(''),
  original_price: Joi.number().positive().messages({
    'number.base': 'Giá gốc phải là số',
    'number.positive': 'Giá gốc phải lớn hơn 0'
  }),
  sale_price: Joi.number().positive().max(Joi.ref('original_price')).messages({
    'number.base': 'Giá khuyến mãi phải là số',
    'number.positive': 'Giá khuyến mãi phải lớn hơn 0',
    'number.max': 'Giá khuyến mãi không được lớn hơn giá gốc'
  }),
  images: Joi.array().items(imageValidation).messages({
  'array.base': 'TEST_LOG - Mảng ảnh không hợp lệ'
}),

  variants: Joi.array().items(variant).max(10).messages({
    'array.max': 'Không được thêm quá 10 biến thể cho sản phẩm'
  }),
  tags: Joi.array().items(Joi.string())
}).min(1);

export default {
  create,
  update
};