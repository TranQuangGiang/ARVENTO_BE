import Joi from "joi";

export const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.string().hex().length(24).required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().positive().required(),
        variant: Joi.object().optional(),
      })
    )
    .min(1)
    .required(),
  total: Joi.number().positive().required(),
  address: Joi.object().required(),
  note: Joi.string().allow("").optional(),
});
