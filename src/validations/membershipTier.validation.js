import Joi from "joi";

export const createMembershipTierSchema = Joi.object({
  name: Joi.string().trim().required(),
  min_spending: Joi.number().min(0).required(),
  point_multiplier: Joi.number().min(0).required(),
  benefits_text: Joi.string().allow(""),
});

export const updateMembershipTierSchema = Joi.object({
  name: Joi.string().trim(),
  min_spending: Joi.number().min(0),
  point_multiplier: Joi.number().min(0),
  benefits_text: Joi.string().allow(""),
}).min(1); // ít nhất phải có 1 trường để update

export const membershipTierIdParam = Joi.object({
  id: Joi.string().hex().length(24).required(),
});
