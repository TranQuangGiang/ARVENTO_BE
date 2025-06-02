import { postService } from '../services/index.js';
import { baseResponse, parseQueryParams } from '../utils/index.js';
import { postValidate } from '../validations/index.js';

const getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {};
    
    // Filter theo category_name
    if (req.query.category_name) {
      filters.category_name = { $regex: req.query.category_name, $options: 'i' };
    }
    
    // Filter theo category (slug)
    if (req.query.category) {
      filters.category = req.query.category;
    }
    
    // Filter theo title
    if (req.query.title) {
      filters.title = { $regex: req.query.title, $options: 'i' };
    }
    
    // Filter theo tags
    if (req.query.tags) {
      filters.tags = { $in: req.query.tags.split(',') };
    }
    
    let sort = { publishedAt: -1, created_at: -1 };
    if (req.query.sort) {
      const sortField = req.query.sort;
      const sortOrder = req.query.order === 'asc' ? 1 : -1;
      sort = { [sortField]: sortOrder };
    }
    
    const result = await postService.getAllPosts(page, limit, filters, sort);
    
    res.status(200).json({
      success: true,
      message: "Lấy danh sách bài viết thành công",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Controller riêng cho admin
const getAllPostsAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {};
    
    // Admin có thể filter theo status
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    if (req.query.category_name) {
      filters.category_name = { $regex: req.query.category_name, $options: 'i' };
    }
    
    if (req.query.category) {
      filters.category = req.query.category;
    }
    
    if (req.query.title) {
      filters.title = { $regex: req.query.title, $options: 'i' };
    }
    
    if (req.query.author) {
      filters.author = req.query.author;
    }
    
    let sort = { created_at: -1 };
    if (req.query.sort) {
      const sortField = req.query.sort;
      const sortOrder = req.query.order === 'asc' ? 1 : -1;
      sort = { [sortField]: sortOrder };
    }
    
    const result = await postService.getAllPostsAdmin(page, limit, filters, sort);
    
    res.status(200).json({
      success: true,
      message: "Lấy danh sách bài viết thành công",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
// Lấy posts theo category_name (exact match)
const getPostsByCategoryName = async (req, res, next) => {
  try {
    const { categoryName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await postService.getPostsByCategoryName(categoryName, page, limit);
    res.status(200).json({
      success: true,
      message: `Lấy bài viết danh mục "${categoryName}" thành công`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
// Lấy danh sách categories
const getCategories = async (req, res, next) => {
  try {
    const result = await postService.getCategories();
    res.status(200).json({
      success: true,
      message: "Lấy danh sách categories thành công",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
// Controller riêng cho admin
const getPostByIdAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await postService.getPostByIdAdmin(id);
   return baseResponse.successResponse(res, result, "Lấy bài viết thành công");
  } catch (error) {
    next(error);
  }
};
const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await postService.getPostById(id);
    return baseResponse.successResponse(res, result, "Lấy bài viết thành công");
  } catch (error) {
    next(error);
  }
};
const createPost = async (req, res) => {
  const { error } = postValidate.createSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return baseResponse.badRequestResponse(res, null, error.details.map(e => e.message).join(', '));
  }
  try {
    const newPost = await postService.createPost(req.body, req.files);
    return baseResponse.createdResponse(res, newPost, "Tạo bài viết thành công");
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 409) return baseResponse.conflictResponse(res, null, err.message);
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const updatePost = async (req, res) => {
  const { error } = postValidate.updateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return baseResponse.badRequestResponse(res, null, error.details.map(e => e.message).join(', '));
  }
  try {
    const updatedPost = await postService.updatePost(req.params.id, req.body, req.files);
    return baseResponse.successResponse(res, updatedPost, "Cập nhật bài viết thành công");
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 404) return baseResponse.notFoundResponse(res, null, err.message);
    if (status === 409) return baseResponse.conflictResponse(res, null, err.message);
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const deletePost = async (req, res) => {
  try {
    await postService.deletePost(req.params.id);
    return baseResponse.successResponse(res, null, "Xóa bài viết thành công");
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 404) return baseResponse.notFoundResponse(res, null, err.message);
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const updatePostCategory = async (req, res) => {
  const { error } = postValidate.categorySchema.validate(req.body, { abortEarly: false });
  if (error) {
    return baseResponse.badRequestResponse(res, null, error.details.map(e => e.message).join(', '));
  }
  try {
    const updatedPost = await postService.updatePostCategory(req.params.id, req.body.category);
    return baseResponse.successResponse(res, updatedPost, "Cập nhật danh mục bài viết thành công");
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 404) return baseResponse.notFoundResponse(res, null, err.message);
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

export default {
  getAllPosts,           // Public API
  getAllPostsAdmin,      // Admin API
  getPostById,           // Public API
  getPostByIdAdmin,      // Admin API
  getPostsByCategoryName,
  getCategories,
  createPost,
  updatePost,
  deletePost,
  updatePostCategory
};
