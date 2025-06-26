import favoriteService from '../services/favorite.service.js';
import response from '../utils/response.util.js';

const addToFavorites = async (req, res) => {
  try {
    const user_id = req.user._id;
    const result = await favoriteService.addToFavorites(user_id, req.body);
    return response.createdResponse(res, result, 'Đã thêm vào yêu thích');
  } catch (error) {
    if (error.code === 11000) {
      return response.conflictResponse(res, null, 'Sản phẩm đã được yêu thích trước đó');
    }
    const status = error.status || 500;
    return response.errorResponse(res, null, error.message, status);
  }
};

const removeFromFavorites = async (req, res) => {
  try {
    const user_id = req.user._id;
    const { product_id } = req.params;
    const result = await favoriteService.removeFromFavorites(user_id, product_id);
    return response.successResponse(res, result, 'Đã xóa khỏi yêu thích');
  } catch (error) {
    return response.errorResponse(res, null, error.message);
  }
};

const getFavorites = async (req, res) => {
  try {
    const user_id = req.user._id;
    const result = await favoriteService.getFavorites(user_id);
    return response.successResponse(res, result, 'Lấy danh sách yêu thích thành công');
  } catch (error) {
    return response.errorResponse(res, null, error.message);
  }
};

const checkFavorite = async (req, res) => {
  try {
    const user_id = req.user._id;
    const { product_id } = req.params;
    const isFavorited = await favoriteService.checkFavorite(user_id, product_id);
    return response.successResponse(res, { isFavorited });
  } catch (error) {
    return response.errorResponse(res, null, error.message);
  }
};

// === ADMIN ===

const getPopularProducts = async (req, res) => {
  try {
    const data = await favoriteService.getPopularProducts();
    return response.successResponse(res, data, 'Top sản phẩm được yêu thích');
  } catch (error) {
    return response.errorResponse(res, null, error.message);
  }
};

const getFavoriteCount = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await favoriteService.getFavoriteCount(id);
    return response.successResponse(res, { count }, 'Tổng số lượt yêu thích');
  } catch (error) {
    return response.errorResponse(res, null, error.message);
  }
};

const getUsersFavoritedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await favoriteService.getUsersFavoritedProduct(id);
    return response.successResponse(res, users, 'Người dùng đã yêu thích sản phẩm');
  } catch (error) {
    return response.errorResponse(res, null, error.message);
  }
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
