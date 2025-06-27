import Joi from 'joi';
import mongoose from 'mongoose';

export const addToFavoriteSchema = Joi.object({
  product_id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('product_id không hợp lệ');
      }
      return value;
    })
});
