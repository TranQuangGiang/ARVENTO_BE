import Joi from "joi";
import mongoose from "mongoose";

// Custom validator cho ObjectId
const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

const variantSchema = Joi.object({
  color: Joi.object({
    name: Joi.string().trim().max(50).required().messages({
      "string.empty": "Tên màu sắc không được để trống",
      "string.max": "Tên màu sắc không được vượt quá 50 ký tự",
      "any.required": "Thiếu tên màu sắc",
    }),
    hex: Joi.string().trim().max(20).allow(null, "").messages({
      "string.max": "Mã màu không được vượt quá 20 ký tự",
    }),
  })
    .required()
    .messages({
      "any.required": "Thiếu thông tin màu sắc",
    }),

  size: Joi.string().trim().max(20).required().messages({
    "string.empty": "Kích cỡ không được để trống",
    "string.max": "Kích cỡ không được vượt quá 20 ký tự",
    "any.required": "Thiếu kích cỡ",
  }),

  sku: Joi.string().trim().max(100).required().messages({
    "string.empty": "SKU không được để trống",
    "string.max": "SKU không được vượt quá 100 ký tự",
    "any.required": "Thiếu SKU",
  }),

  price: Joi.number().min(0).required().messages({
    "number.base": "Giá phải là số",
    "number.min": "Giá không được âm",
    "any.required": "Thiếu giá sản phẩm",
  }),

  sale_price: Joi.number().min(0).allow(null).messages({
    "number.base": "Giá khuyến mãi phải là số",
    "number.min": "Giá khuyến mãi không được âm",
  }),

  stock: Joi.number().integer().min(0).required().messages({
    "number.base": "Tồn kho phải là số nguyên",
    "number.min": "Tồn kho không được âm",
    "any.required": "Thiếu số lượng tồn kho",
  }),

  image: Joi.object({
    url: Joi.string().uri().allow("").messages({
      "string.uri": "Đường dẫn ảnh không hợp lệ",
    }),
    alt: Joi.string().max(100).allow("").messages({
      "string.max": "Alt text không được vượt quá 100 ký tự",
    }),
  })
    .required()
    .messages({
      "any.required": "Thiếu thông tin ảnh",
    }),
});
// Schema cho thêm sản phẩm vào giỏ hàng
export const addItemSchema = Joi.object({
  product_id: Joi.string().trim().custom(objectIdValidator, "ObjectId validation").required().messages({
    "string.empty": "product_id không được để trống",
    "any.required": "Thiếu product_id",
    "any.invalid": "product_id không hợp lệ",
  }),
  selected_variant: variantSchema.required().messages({
    "any.required": "Thiếu thông tin biến thể sản phẩm",
    "object.base": "selected_variant phải là object",
  }),
  quantity: Joi.number().integer().min(1).max(10).required().messages({
    "number.base": "Số lượng phải là số",
    "number.integer": "Số lượng phải là số nguyên",
    "number.min": "Số lượng tối thiểu là 1",
    "number.max": "Số lượng tối đa là 10",
    "any.required": "Thiếu số lượng sản phẩm",
  }),
});
// Validation cho cập nhật số lượng sản phẩm
export const updateQuantitySchema = Joi.object({
  product_id: Joi.string().custom(objectIdValidator, "ObjectId validation").required().messages({
    "any.required": "ID sản phẩm là bắt buộc",
    "string.empty": "ID sản phẩm không được để trống",
    "any.invalid": "ID sản phẩm không hợp lệ",
  }),
  selected_variant: variantSchema.required().messages({
    "any.required": "Thông tin variant sản phẩm là bắt buộc",
    "object.base": "selected_variant phải là object",
  }),
  quantity: Joi.number().integer().min(0).max(999).required().messages({
    "number.base": "Số lượng phải là số nguyên",
    "number.min": "Số lượng không được âm (0 để xóa sản phẩm)",
    "number.max": "Số lượng không được vượt quá 999",
    "any.required": "Số lượng là bắt buộc",
  }),
});

// Validation cho xóa sản phẩm khỏi giỏ hàng
export const removeItemSchema = Joi.object({
  product_id: Joi.string().custom(objectIdValidator, "ObjectId validation").required().messages({
    "any.required": "ID sản phẩm là bắt buộc",
    "string.empty": "ID sản phẩm không được để trống",
    "any.invalid": "ID sản phẩm không hợp lệ",
  }),
  selected_variant: Joi.object({
    color: Joi.object({
      name: Joi.string().trim().max(50).required().messages({
        "string.empty": "Tên màu không được để trống",
        "string.max": "Tên màu không được vượt quá 50 ký tự",
        "any.required": "Tên màu là bắt buộc",
      }),
      hex: Joi.string().trim().required().messages({
        "string.empty": "Mã màu không được để trống",
        "any.required": "Mã màu là bắt buộc",
      }),
    })
      .required()
      .messages({
        "any.required": "Thông tin màu sắc là bắt buộc",
      }),
    size: Joi.string().trim().max(20).required().messages({
      "string.empty": "Kích cỡ không được để trống",
      "string.max": "Kích cỡ không được vượt quá 20 ký tự",
      "any.required": "Kích cỡ là bắt buộc",
    }),
  })
    .required()
    .messages({
      "any.required": "Thông tin variant sản phẩm là bắt buộc",
    }),
});

// Validation cho áp dụng mã giảm giá
export const applyCouponSchema = Joi.object({
  coupon_code: Joi.string()
    .trim()
    .uppercase()
    .min(3)
    .max(20)
    .pattern(/^[A-Z0-9]+$/)
    .required()
    .messages({
      "string.empty": "Mã giảm giá không được để trống",
      "string.min": "Mã giảm giá phải có ít nhất 3 ký tự",
      "string.max": "Mã giảm giá không được vượt quá 20 ký tự",
      "string.pattern.base": "Mã giảm giá chỉ được chứa chữ cái và số",
      "any.required": "Mã giảm giá là bắt buộc",
    }),
});

// Validation cho save for later
export const saveForLaterSchema = Joi.object({
  product_id: Joi.string().custom(objectIdValidator, "ObjectId validation").required().messages({
    "any.required": "ID sản phẩm là bắt buộc",
    "any.invalid": "ID sản phẩm không hợp lệ",
    "string.empty": "ID sản phẩm không được để trống",
  }),
  selected_variant: Joi.object({
    color: Joi.string().trim().max(50).required().messages({
      "string.empty": "Màu sắc không được để trống",
      "string.max": "Màu sắc không được vượt quá 50 ký tự",
      "any.required": "Màu sắc là bắt buộc",
    }),
    size: Joi.string().trim().max(20).required().messages({
      "string.empty": "Kích cỡ không được để trống",
      "string.max": "Kích cỡ không được vượt quá 20 ký tự",
      "any.required": "Kích cỡ là bắt buộc",
    }),
  })
    .required()
    .messages({
      "any.required": "Thông tin variant sản phẩm là bắt buộc",
    }),
});

// Validation cho move to cart
export const moveToCartSchema = saveForLaterSchema;

// Query validation cho get cart
export const getCartQuerySchema = Joi.object({
  include_saved: Joi.boolean().default(true).messages({
    "boolean.base": "include_saved phải là boolean",
  }),
});

// Validation cho bulk operations
export const bulkUpdateSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.string().custom(objectIdValidator, "ObjectId validation").required(),
        selected_variant: Joi.object({
          color: Joi.string().trim().max(50).required(),
          size: Joi.string().trim().max(20).required(),
        }).required(),
        quantity: Joi.number().integer().min(0).max(999).required(),
      })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      "array.min": "Phải có ít nhất 1 sản phẩm để cập nhật",
      "array.max": "Không được cập nhật quá 50 sản phẩm cùng lúc",
      "any.required": "Danh sách sản phẩm là bắt buộc",
    }),
});

export default {
  addItemSchema,
  updateQuantitySchema,
  removeItemSchema,
  applyCouponSchema,
  saveForLaterSchema,
  moveToCartSchema,
  getCartQuerySchema,
  bulkUpdateSchema,
};
