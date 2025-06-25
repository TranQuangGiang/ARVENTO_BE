import Joi from 'joi';

const imageValidation = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.uri': 'URL ảnh không hợp lệ',
    'any.required': 'URL ảnh là bắt buộc'
  }),
  alt: Joi.string().max(100).optional()
});

const variantValidation = Joi.object({
  size: Joi.string().max(10).optional(),
  color: Joi.string().max(50).optional(),
  stock: Joi.number().integer().min(0).default(0),
  image: imageValidation.required().messages({
    'any.required': 'Ảnh biến thể là bắt buộc'
  })
});

export const productValidate = {
   create: Joi.object({
    category_id: Joi.string().required().messages({
      'string.empty': 'category_id không được để trống',
      'any.required': 'category_id là bắt buộc'
    }),
    product_code: Joi.string().max(50).required().messages({
      'string.empty': 'product_code không được để trống',
      'any.required': 'product_code là bắt buộc'
    }),
    name: Joi.string().max(150).required().messages({
      'string.empty': 'name không được để trống',
      'any.required': 'name là bắt buộc'
    }),
    slug: Joi.string().max(150).optional().messages({
      'string.empty': 'slug không được để trống'
    }),
    description: Joi.string().optional().messages({
      'string.empty': 'description không được để trống'
    }),
    original_price: Joi.number().min(0).required().messages({
      'number.min': 'original_price phải lớn hơn hoặc bằng 0',
      'any.required': 'original_price là bắt buộc'
    }),
    sale_price: Joi.number()
      .min(0)
      .optional()
      .less(Joi.ref('original_price'))
      .messages({
        'number.min': 'sale_price phải lớn hơn hoặc bằng 0',
        'number.less': 'Giá khuyến mãi không được lớn hơn giá gốc'
      }),
    stock: Joi.number().integer().min(0).required().messages({
      'number.min': 'stock phải lớn hơn hoặc bằng 0',
      'any.required': 'stock là bắt buộc'
    }),
    tags: Joi.array().items(Joi.string()).optional().messages({
      'array.base': 'tags phải là mảng'
    }),
    images: Joi.array().items(imageValidation).min(1).required().messages({
      'array.base': 'Ảnh sản phẩm phải là mảng',
      'array.min': 'Cần ít nhất 1 ảnh sản phẩm',
      'any.required': 'Ảnh sản phẩm là bắt buộc'
    }),
    variants: Joi.array().items(variantValidation).optional(),
      options: Joi.object({
    size: Joi.array().items(Joi.string()).optional(),
    color: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        hex: Joi.string().optional()
      })
    ).optional()
  }).optional()

  }),
  update: Joi.object({
    category_id: Joi.alternatives().try(Joi.string(), Joi.object()).messages({
  'string.empty': 'category_id không được để trống'
}),
    product_code: Joi.string().max(50).messages({
      'string.empty': 'product_code không được để trống'
    }),
    name: Joi.string().max(150).messages({
      'string.empty': 'name không được để trống'
    }),
    slug: Joi.string().max(150).messages({
      'string.empty': 'slug không được để trống'
    }),
    description: Joi.string().messages({
      'string.empty': 'description không được để trống'
    }),
    original_price: Joi.number().min(0).messages({
      'number.min': 'original_price phải lớn hơn hoặc bằng 0'
    }),
    sale_price: Joi.number()
      .min(0)
      .optional()
      .less(Joi.ref('original_price'))
      .messages({
        'number.min': 'sale_price phải lớn hơn hoặc bằng 0',
        'number.less': 'Giá khuyến mãi không được lớn hơn giá gốc'
      }),
    stock: Joi.number().integer().min(0).messages({
      'number.min': 'stock phải lớn hơn hoặc bằng 0'
    }),
    tags: Joi.array().items(Joi.string()).messages({
      'array.base': 'tags phải là mảng'
    }),

    isActive: Joi.boolean().messages({
      'boolean.base': 'isActive phải là boolean'
    }),
        images: Joi.array().items(imageValidation).optional(),
    variants: Joi.array().items(variantValidation).optional()

  }),
  search: Joi.object({
    query: Joi.string().max(100).messages({
      'string.empty': 'query không được để trống',
      'string.max': 'query không được vượt quá 100 ký tự'
    }),
    category_id: Joi.string().messages({
      'string.empty': 'category_id không được để trống'
    }),
    min_price: Joi.number().min(0).messages({
      'number.min': 'min_price phải lớn hơn hoặc bằng 0'
    }),
    max_price: Joi.number().min(0).messages({
      'number.min': 'max_price phải lớn hơn hoặc bằng 0'
    }),
    sort: Joi.string().valid('name_asc', 'name_desc', 'price_asc', 'price_desc').default('name_asc').messages({
      'any.only': 'Giá trị sort không hợp lệ. Phải là: name_asc, name_desc, price_asc, price_desc'
    }),
    page: Joi.number().integer().min(1).default(1).messages({
      'number.min': 'Page must be greater than 0'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.min': 'Limit must be greater than 0',
      'number.max': 'Limit cannot exceed 100'
    })
  }),
  filter: Joi.object({
    category_id: Joi.string().messages({
      'string.empty': 'category_id không được để trống'
    }),
    min_price: Joi.number().min(0).messages({
      'number.min': 'Giá tối thiểu phải lớn hơn hoặc bằng 0'
    }),
    max_price: Joi.number().min(0).messages({
      'number.min': 'Giá tối đa phải lớn hơn hoặc bằng 0'
    }),
    sort: Joi.string().valid('name_asc', 'name_desc', 'price_asc', 'price_desc').default('name_asc').messages({
      'any.only': 'Giá trị sort không hợp lệ. Phải là: name_asc, name_desc, price_asc, price_desc'
    }),
    page: Joi.number().integer().min(1).default(1).messages({
      'number.min': 'Page must be greater than 0'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.min': 'Limit must be greater than 0',
      'number.max': 'Limit cannot exceed 100'
    })
  }),
  exportValidation: Joi.object({
    format: Joi.string().valid('excel', 'csv').default('excel').messages({
      'any.only': 'Format must be excel or csv'
    })
  })
};

export default productValidate;