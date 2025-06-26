import Joi from "joi";

export const createCODPaymentSchema = Joi.object({
  order: Joi.string().hex().length(24).required(),
  amount: Joi.number().positive().required(),
  note: Joi.string().allow("").optional(),
});

export const createBankingPaymentSchema = Joi.object({
  order: Joi.string().hex().length(24).required(),
  amount: Joi.number().positive().required(),
  note: Joi.string().allow("").optional(),
});

export const refundRequestSchema = Joi.object({
  paymentId: Joi.string().required(),
  reason: Joi.string().min(5).max(255).required(),
});
