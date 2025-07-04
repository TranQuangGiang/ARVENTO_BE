import Joi from "joi";

export const createAddressSchema = Joi.object({
  province: Joi.string().trim().required().max(100).messages({
    "any.required": "Tỉnh/Thành phố là bắt buộc",
    "string.max": "Tên Tỉnh/Thành phố không được quá 100 ký tự",
  }),
  province_id: Joi.number().integer().required().messages({
    "any.required": "ID Tỉnh/Thành phố là bắt buộc",
  }),
  district: Joi.string().trim().required().max(100).messages({
    "any.required": "Quận/Huyện là bắt buộc",
    "string.max": "Tên Quận/Huyện không được quá 100 ký tự",
  }),
  district_id: Joi.number().integer().required().messages({
    "any.required": "ID Quận/Huyện là bắt buộc",
  }),
  ward: Joi.string().trim().required().max(100).messages({
    "any.required": "Phường/Xã là bắt buộc",
    "string.max": "Tên Phường/Xã không được quá 100 ký tự",
  }),
  ward_code: Joi.string().trim().required().messages({
    "any.required": "Mã Phường/Xã là bắt buộc",
  }),
  detail: Joi.string().trim().max(500).allow(null, "").messages({
    "string.max": "Chi tiết địa chỉ không được quá 500 ký tự",
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]*$/)
    .max(20)
    .allow(null, "")
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ",
      "string.max": "Số điện thoại không được quá 20 ký tự",
    }),
  isDefault: Joi.boolean().optional(),
  label: Joi.string().trim().max(50).default("Nhà").messages({
    "string.max": "Nhãn địa chỉ không được quá 50 ký tự",
  }),
});

export const updateAddressSchema = Joi.object({
  province: Joi.string().max(100).optional(),
  province_id: Joi.number().optional(),
  district: Joi.string().max(100).optional(),
  district_id: Joi.number().optional(),
  ward: Joi.string().max(100).optional(),
  ward_code: Joi.string().optional(),
  detail: Joi.string().max(500).allow("").optional(),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]*$/)
    .max(20)
    .allow("")
    .optional()
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ",
      "string.max": "Số điện thoại không được quá 20 ký tự",
    }),
  isDefault: Joi.boolean().optional(),
  label: Joi.string().max(50).allow("").optional(),
  userId: Joi.string().optional(), // Chỉ cho admin
});