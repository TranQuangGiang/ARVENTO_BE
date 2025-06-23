import Joi from 'joi';

const imageSchema = Joi.object({
  url: Joi.string()
    .uri({ scheme: [/https?/] })
    .allow('')
    .messages({
      'string.uri': 'URL ảnh không hợp lệ',
    }),
  alt: Joi.string().max(100).allow('').messages({
    'string.max': 'Alt ảnh không vượt quá 100 ký tự',
  }),
});


const variantSchema = Joi.object({
  size: Joi.string().max(10).allow(null, '').messages({
    'string.max': 'Size không vượt quá 10 ký tự',
  }),
  color: Joi.object({
  name: Joi.string().max(50).required(),
  hex: Joi.string().pattern(/^#([0-9a-fA-F]{6})$/).required()
}).optional().messages({
  'object.base': 'Color phải là object với name và hex',
  'string.pattern.base': 'Mã màu hex không hợp lệ'
}),
  stock: Joi.alternatives().try(
  Joi.number(),
  Joi.string().pattern(/^\d+$/).custom((v, helpers) => Number(v))
).required().messages({
  'number.base': 'Stock phải là số',
  'any.required': 'Stock là bắt buộc'
}),

  sku: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'SKU không vượt quá 100 ký tự',
  }),
  price: Joi.number().min(0).allow(null).messages({
    'number.base': 'Giá phải là số',
    'number.min': 'Giá không được âm',
  }),
  image: imageSchema.optional(), //  Cho phép không truyền image
  imageIndex: Joi.number().min(0).optional().messages({
    'number.base': 'imageIndex phải là số',
    'number.min': 'imageIndex không hợp lệ'
  })
});


const validateVariantJoi = (req, res, next) => {
  try {
    if (typeof req.body.color === 'string') {
      req.body.color = JSON.parse(req.body.color);
    }

    if (typeof req.body.image === 'string') {
      req.body.image = JSON.parse(req.body.image);
    }

    delete req.body.variants;
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: 'Không thể phân tích dữ liệu',
      errors: [{ field: 'color / image', message: 'Dữ liệu không hợp lệ: JSON parse fail' }],
    });
  }

  const { error } = variantSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true // hoặc bỏ dòng này nếu muốn bắt lỗi chặt
  });

  if (error) {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: error.details.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      })),
    });
  }

  next();
};




export default {
  validateVariantJoi,
};
