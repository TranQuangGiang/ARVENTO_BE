import favoriteModel from '../models/favorite.model.js';
import productModel from '../models/product.model.js';
import userModel from '../models/user.model.js';
import { addToFavoriteSchema } from '../validations/favorite.validation.js';
import mongoose from 'mongoose';

const addToFavorites = async (user_id, body) => {
  const { error, value } = addToFavoriteSchema.validate(body);
  if (error) {
    const err = new Error(error.details.map((d) => d.message).join(', '));
    err.status = 422;
    throw err;
  }

  const { product_id } = value;

  const product = await productModel.findById(product_id);
  if (!product) {
    const err = new Error('Sản phẩm không tồn tại');
    err.status = 404;
    throw err;
  }

  const favorite = await favoriteModel.create({ user_id, product_id });
  return favorite;
};

const removeFromFavorites = async (user_id, product_id) => {
  await favoriteModel.deleteOne({ user_id, product_id });
  return { removed: true };
};

const getFavorites = async (user_id) => {
  return favoriteModel
    .find({ user_id })
    .populate('product_id')
    .sort({ created_at: -1 });
};

const checkFavorite = async (user_id, product_id) => {
  const exists = await favoriteModel.exists({ user_id, product_id });
  return !!exists;
};

const getPopularProducts = async () => {
  const result = await favoriteModel.aggregate([
    { $group: { _id: '$product_id', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    { $project: { _id: 0, product: 1, count: 1 } },
  ]);
  return result;
};

const getFavoriteCount = async (product_id) => {
  return favoriteModel.countDocuments({ product_id });
};

const getUsersFavoritedProduct = async (product_id) => {
  return favoriteModel
    .find({ product_id })
    .populate('user_id', 'name email');
};

export default {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  checkFavorite,
  getPopularProducts,
  getFavoriteCount,
  getUsersFavoritedProduct,
};
