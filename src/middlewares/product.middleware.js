import { productValidate } from '../validations/product.validation.js';

export const validateProductCreate = (req, res, next) => {
  const { error } = productValidate.create.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: error.details.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  next();
};
