// 📁 validations/review.validation.js
import Joi from 'joi';
import mongoose from 'mongoose';

// Kiểm tra ObjectId hợp lệ
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('"{{#label}}" phải là ObjectId hợp lệ');
  }
  return value;
};

//  Validation cho tạo đánh giá
export const createReviewSchema = Joi.object({
  product_id: Joi.string().required().custom(objectId),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().allow('', null),
  images: Joi.array().items(Joi.string().uri()).max(5).optional()
});

// Validation cho cập nhật đánh giá
export const updateReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).optional(),
  comment: Joi.string().allow('', null),
  images: Joi.array().items(Joi.string().uri()).max(5).optional()
});

//  Validation cho admin phản hồi đánh giá
export const replyReviewSchema = Joi.object({
  reply: Joi.string().required()
});
