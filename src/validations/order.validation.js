import Joi from "joi";

// Schema validation cho variant (tương tự cart)
const orderVariantSchema = Joi.object({
  color: Joi.object({
    name: Joi.string().trim().max(50).required().messages({
      "string.empty": "Tên màu sắc là bắt buộc",
      "string.max": "Tên màu sắc không được vượt quá 50 ký tự",
    }),
    hex: Joi.string().trim().max(20).allow(null, "").optional(),
  }).required(),
  size: Joi.string().trim().max(20).required().messages({
    "string.empty": "Kích cỡ là bắt buộc",
    "string.max": "Kích cỡ không được vượt quá 20 ký tự",
  }),
  sku: Joi.string().trim().max(100).required().messages({
    "string.empty": "SKU là bắt buộc",
    "string.max": "SKU không được vượt quá 100 ký tự",
  }),
  price: Joi.number().positive().required().messages({
    "number.positive": "Giá sản phẩm phải lớn hơn 0",
    "any.required": "Giá sản phẩm là bắt buộc",
  }),
  stock: Joi.number().integer().min(0).required().messages({
    "number.min": "Số lượng tồn kho không được âm",
    "any.required": "Số lượng tồn kho là bắt buộc",
  }),
  image: Joi.object({
    url: Joi.string().trim().allow("").optional(),
    alt: Joi.string().trim().max(100).allow("").optional(),
  }).optional(),
});

// Schema validation cho order item
const orderItemSchema = Joi.object({
  product: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID sản phẩm không hợp lệ",
    "string.length": "ID sản phẩm phải có độ dài 24 ký tự",
    "any.required": "ID sản phẩm là bắt buộc",
  }),
  selected_variant: orderVariantSchema.required(),
  quantity: Joi.number().integer().min(1).max(999).required().messages({
    "number.min": "Số lượng phải ít nhất là 1",
    "number.max": "Số lượng không được vượt quá 999",
    "any.required": "Số lượng là bắt buộc",
  }),
  unit_price: Joi.number().positive().required().messages({
    "number.positive": "Giá đơn vị phải lớn hơn 0",
    "any.required": "Giá đơn vị là bắt buộc",
  }),
  total_price: Joi.number().positive().required().messages({
    "number.positive": "Tổng giá phải lớn hơn 0",
    "any.required": "Tổng giá là bắt buộc",
  }),
  // Backward compatibility fields
  price: Joi.number().positive().optional(),
  variant: Joi.object().optional(),
});

// Schema validation cho applied coupon
const appliedCouponSchema = Joi.object({
  code: Joi.string()
    .trim()
    .uppercase()
    .min(3)
    .max(20)
    .pattern(/^[A-Z0-9]+$/)
    .optional()
    .messages({
      "string.pattern.base": "Mã giảm giá chỉ được chứa chữ cái và số",
      "string.min": "Mã giảm giá phải có ít nhất 3 ký tự",
      "string.max": "Mã giảm giá không được vượt quá 20 ký tự",
    }),
  discount_amount: Joi.number().min(0).optional().messages({
    "number.min": "Số tiền giảm giá không được âm",
  }),
  discount_type: Joi.string().valid("percentage", "fixed", "fixed_amount").default("percentage").optional(),
});

// Schema chính cho tạo đơn hàng
export const createOrderSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).max(100).required().messages({
    "array.min": "Đơn hàng phải có ít nhất 1 sản phẩm",
    "array.max": "Đơn hàng không được có quá 100 sản phẩm",
    "any.required": "Danh sách sản phẩm là bắt buộc",
  }),
  subtotal: Joi.number().positive().required().messages({
    "number.positive": "Tổng phụ phải lớn hơn 0",
    "any.required": "Tổng phụ là bắt buộc",
  }),
  applied_coupon: appliedCouponSchema.optional(),
  total: Joi.number().positive().required().messages({
    "number.positive": "Tổng tiền phải lớn hơn 0",
    "any.required": "Tổng tiền là bắt buộc",
  }),
  shipping_address: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID địa chỉ giao hàng không hợp lệ",
    "string.length": "ID địa chỉ giao hàng phải có độ dài 24 ký tự",
    "any.required": "Địa chỉ giao hàng là bắt buộc",
  }),
  // Dùng khi người dùng muốn tách riêng địa chỉ thanh toán với địa chỉ giao hàng.
  billing_address: Joi.string().hex().length(24).optional().messages({
    "string.hex": "ID địa chỉ thanh toán không hợp lệ",
    "string.length": "ID địa chỉ thanh toán phải có độ dài 24 ký tự",
  }),
  shipping_fee: Joi.number().min(0).optional().messages({
    "number.min": "Phí vận chuyển không được nhỏ hơn 0",
  }),
  payment_method: Joi.string().valid("cod", "banking", "zalopay", "momo").default("cod").optional(),
  note: Joi.string().trim().max(500).allow("").optional().messages({
    "string.max": "Ghi chú không được vượt quá 500 ký tự",
  }),
  // Backward compatibility fields
  address: Joi.object().optional(),
});

// Schema cho cập nhật trạng thái đơn hàng
export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid("pending", "confirmed", "processing", "shipping", "delivered", "completed", "cancelled", "returned").required().messages({
    "any.only": "Trạng thái không hợp lệ",
    "any.required": "Trạng thái là bắt buộc",
  }),
  note: Joi.string().trim().max(500).allow("").optional().messages({
    "string.max": "Ghi chú không được vượt quá 500 ký tự",
  }),
});

// Schema cho query parameters khi lấy danh sách đơn hàng
export const getOrdersQuerySchema = Joi.object({
  status: Joi.string().valid("pending", "confirmed", "processing", "shipping", "delivered", "completed", "cancelled", "returned").optional(),
  payment_status: Joi.string().valid("pending", "processing", "completed", "failed", "cancelled", "refunded").optional(),
  payment_method: Joi.string().valid("cod", "banking", "zalopay", "momo").optional(),
  user: Joi.string().hex().length(24).optional().messages({
    "string.hex": "ID người dùng không hợp lệ",
    "string.length": "ID người dùng phải có độ dài 24 ký tự",
  }),
  dateFrom: Joi.date().iso().optional().messages({
    "date.format": "Ngày bắt đầu phải có định dạng ISO",
  }),
  dateTo: Joi.date().iso().min(Joi.ref("dateFrom")).optional().messages({
    "date.format": "Ngày kết thúc phải có định dạng ISO",
    "date.min": "Ngày kết thúc phải sau ngày bắt đầu",
  }),
  page: Joi.number().integer().min(1).default(1).optional().messages({
    "number.min": "Trang phải lớn hơn 0",
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).optional().messages({
    "number.min": "Số lượng phải lớn hơn 0",
    "number.max": "Số lượng không được vượt quá 100",
  }),
  sort: Joi.string().valid("created_at", "-created_at", "total", "-total", "status", "-status").default("-created_at").optional(),
});

// Schema cho export đơn hàng
export const exportOrdersQuerySchema = Joi.object({
  status: Joi.string().valid("pending", "confirmed", "processing", "shipping", "delivered", "completed", "cancelled", "returned").optional(),
  user: Joi.string().hex().length(24).optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().min(Joi.ref("from")).optional(),
});

// Schema cho thống kê doanh thu
export const revenueQuerySchema = Joi.object({
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().min(Joi.ref("from")).optional(),
  groupBy: Joi.string().valid("day", "month", "year").default("day").optional(),
});

// Schema cho tạo đơn hàng từ giỏ hàng
export const createOrderFromCartSchema = Joi.object({
  shipping_address: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID địa chỉ giao hàng không hợp lệ",
    "string.length": "ID địa chỉ giao hàng phải có độ dài 24 ký tự",
    "any.required": "Địa chỉ giao hàng là bắt buộc",
  }),
  billing_address: Joi.string().hex().length(24).optional(),
  payment_method: Joi.string().valid("cod", "banking", "zalopay", "momo").default("cod").optional(),
  note: Joi.string().trim().max(500).allow("").optional(),
  use_cart_coupon: Joi.boolean().default(true).optional(),
});
