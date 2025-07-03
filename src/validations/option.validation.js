import Joi from 'joi';

const colorValueSchema = Joi.object({
  name: Joi.string().trim().required(),
  hex: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required()
});

const stringArray = Joi.array().items(Joi.string().trim());
const colorArray = Joi.array().items(colorValueSchema);

export const createOptionSchema = Joi.object({
  key: Joi.string().trim().required(),
  values: Joi.alternatives().conditional('key', {
    is: 'color',
    then: colorArray.required(),
    otherwise: stringArray.required()
  })
});

export const updateOptionSchema = Joi.object({
  values: Joi.alternatives().conditional(Joi.ref('$key'), {
    is: Joi.string().valid('color'),
    then: colorArray.required(),
    otherwise: stringArray.required()
  })
});
