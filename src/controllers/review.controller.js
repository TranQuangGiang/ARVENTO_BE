import reviewService from '../services/review.service.js';
import response from '../utils/response.util.js';

export const createReview = async (req, res) => {
  try {
    const images = req.body.images || [];
    const result = await reviewService.create(req.user._id, { ...req.body, images });
    
    const message = result.approved
      ? "Đánh giá đã được tự động duyệt."
      : "Đánh giá chứa từ ngữ không phù hợp, đang chờ admin duyệt.";

    return response.createdResponse(res, result, message);
  } catch (err) {
    return response.errorResponse(res, null, err.message);
  }
};

export const getReviewsByProduct = async (req, res) => {
  try {
    const result = await reviewService.getByProduct(req.params.productId, req.query);
    return response.successResponse(res, result);
  } catch (err) {
    return response.errorResponse(res, null, err.message);
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const result = await reviewService.getByUser(req.user._id);
    return response.successResponse(res, result);
  } catch (err) {
    return response.errorResponse(res, null, err.message);
  }
};

export const updateReview = async (req, res) => {
  try {
    const images = req.body.images || [];
    const result = await reviewService.update(
      req.user._id,
      req.params.reviewId,
      { ...req.body, images }
    );

    const message = result.approved
      ? 'Cập nhật đánh giá thành công và đã tự động duyệt.'
      : 'Cập nhật đánh giá thành công. Đánh giá đang chờ admin duyệt.';

    return response.successResponse(res, result, message);
  } catch (err) {
    return response.errorResponse(res, null, err.message);
  }
};

export const deleteReview = async (req, res) => {
  try {
    await reviewService.remove(req.user._id, req.params.reviewId);
    return response.successResponse(res, null, 'Đã xoá đánh giá.');
  } catch (err) {
    return response.errorResponse(res, null, err.message);
  }
};

// Admin
export const getAllReviews = async (req, res) => {
  try {
    const result = await reviewService.getAll(req.query);
    return response.successResponse(res, result);
  } catch (err) {
    return response.errorResponse(res, null, err.message);
  }
};

export const approveReview = async (req, res) => {
  try {
    const result = await reviewService.approve(req.params.reviewId);
    return response.successResponse(res, result, 'Đã duyệt đánh giá.');
  } catch (err) {
    return response.errorResponse(res, null, err.message);
  }
};

export const hideReview = async (req, res) => {
  try {
    const result = await reviewService.hide(req.params.reviewId);
    const message = result.hidden
      ? 'Đánh giá đã được ẩn.'
      : 'Đánh giá đã được hiển thị.';

    return response.successResponse(res, result, message);
  } catch (err) {
    return response.errorResponse(res, null, err.message);
  }
};

export const replyReview = async (req, res) => {
  try {
    const result = await reviewService.reply(req.params.reviewId, req.body.reply);
    return response.successResponse(res, result, 'Đã phản hồi đánh giá.');
  } catch (err) {
    return response.errorResponse(res, null, err.message);
  }
};

export const deleteReviewByAdmin = async (req, res) => {
  try {
    await reviewService.deleteByAdmin(req.params.reviewId);
    return response.successResponse(res, null, 'Đã xoá đánh giá.');
  } catch (err) {
    return response.errorResponse(res, null, err.message);
  }
};

export const getProductStats = async (req, res) => {
  try {
    const result = await reviewService.getStatsByProduct(req.params.productId);
    return response.successResponse(res, result);
  } catch (err) {
    return response.errorResponse(res, null, err.message);
  }
};

export const getReviewDashboard = async (req, res) => {
  try {
    const result = await reviewService.getDashboardStats();
    return response.successResponse(res, result);
  } catch (err) {
    return response.errorResponse(res, null, err.message);
  }
};
export const getReviewDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await reviewService.getReviewById(id);

    if (!review) {
      return response.notFoundResponse(res, null, 'Review not found');
    }

    return response.successResponse(res, review, 'Get review detail successfully');
  } catch (error) {
    console.error(error);
    return response.errorResponse(res, null, 'Internal server error');
  }
};