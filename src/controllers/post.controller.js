// src/controllers/post.controller.js
import postService from '../services/post.service.js';
import categoryPostService from '../services/categoryPost.service.js'; // To validate category existence
import responseUtil from '../utils/response.util.js';
import postValidation from '../validations/post.validation.js';

// Client - Get all published posts
const getAllPostsClient = async (req, res) => {
  try {
    const { page, limit, sort } = req.query;
    const options = { page: parseInt(page) || 1, limit: parseInt(limit) || 10, sort };
    const posts = await postService.getAllPosts({ status: 'published' }, options);
    return responseUtil.successResponse(res, posts, 'Lấy tất cả bài viết thành công');
  } catch (error) {
    return responseUtil.errorResponse(res, null, error.message);
  }
};

// Client - Get posts by category slug
const getPostsByCategorySlugClient = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page, limit, sort } = req.query;
    const options = { page: parseInt(page) || 1, limit: parseInt(limit) || 10, sort };

    const category = await categoryPostService.getCategoryBySlug(slug);
    if (!category) {
      return responseUtil.notFoundResponse(res, null, 'Không tìm thấy danh mục này');
    }

    const posts = await postService.getPostsByCategory(category._id, options);
    return responseUtil.successResponse(res, posts, `Lấy bài viết theo danh mục "${category.name}" thành công`);
  } catch (error) {
    return responseUtil.errorResponse(res, null, error.message);
  }
};

// Client - Get post by slug (detail) and increment view count
const getPostBySlugClient = async (req, res) => {
  try {
    const { slug } = req.params;
    let post = await postService.getPostBySlug(slug);

    if (!post || post.status !== 'published') { // Only show published posts to clients
      return responseUtil.notFoundResponse(res, null, 'Không tìm thấy bài viết này');
    }

    // Increment view count
    post = await postService.incrementViewCount(post._id);

    return responseUtil.successResponse(res, post, 'Lấy chi tiết bài viết thành công');
  } catch (error) {
    return responseUtil.errorResponse(res, null, error.message);
  }
};

// Admin - Get all posts
const getAllPostsAdmin = async (req, res) => {
  try {
    const { page, limit, sort, status, category, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.title = { $regex: search, $options: 'i' }; // Case-insensitive search by title
    }

    const options = { page: parseInt(page) || 1, limit: parseInt(limit) || 10, sort };
    const posts = await postService.getAllPosts(filter, options);
    return responseUtil.successResponse(res, posts, 'Lấy tất cả bài viết thành công');
  } catch (error) {
    return responseUtil.errorResponse(res, null, error.message);
  }
};

// Admin - Get post by ID
const getPostByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await postService.getPostById(id);
    if (!post) {
      return responseUtil.notFoundResponse(res, null, 'Không tìm thấy bài viết');
    }
    return responseUtil.successResponse(res, post, 'Lấy bài viết theo ID thành công');
  } catch (error) {
    if (error.name === 'CastError') {
      return responseUtil.badRequestResponse(res, null, 'ID bài viết không hợp lệ');
    }
    return responseUtil.errorResponse(res, null, error.message);
  }
};

// Admin - Create new post
const createPost = async (req, res) => {
  try {
    const { error, value } = postValidation.createPostSchema.validate(req.body);
    if (error) {
      return responseUtil.validationErrorResponse(res, error.details);
    }

    // Check if category exists
    const categoryExists = await categoryPostService.getCategoryById(value.category);
    if (!categoryExists) {
      return responseUtil.badRequestResponse(res, null, 'Danh mục bài viết không tồn tại');
    }

    // Handle uploaded files (thumbnail and album)
    if (req.files) {
      if (req.files.thumbnail && req.files.thumbnail.length > 0) {
        value.thumbnail = req.files.thumbnail[0].url;
      }
      if (req.files.album && req.files.album.length > 0) {
        value.album = req.files.album.map(file => file.url);
      }
    }

    // Auto-generate slug if not provided
    if (!value.slug && value.title) {
      value.slug = value.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    // Check if slug already exists
    const existingPostBySlug = await postService.getPostBySlug(value.slug);
    if (existingPostBySlug) {
      return responseUtil.conflictResponse(res, null, 'Slug bài viết đã tồn tại');
    }


    const newPost = await postService.createPost(value);
    return responseUtil.createdResponse(res, newPost, 'Tạo bài viết mới thành công');
  } catch (error) {
    return responseUtil.errorResponse(res, null, error.message);
  }
};

// Admin - Update post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = postValidation.updatePostSchema.validate(req.body);
    if (error) {
      return responseUtil.validationErrorResponse(res, error.details);
    }

    if (Object.keys(value).length === 0) {
      return responseUtil.badRequestResponse(res, null, 'Không có dữ liệu để cập nhật');
    }

    // Check if category exists if updated
    if (value.category) {
      const categoryExists = await categoryPostService.getCategoryById(value.category);
      if (!categoryExists) {
        return responseUtil.badRequestResponse(res, null, 'Danh mục bài viết không tồn tại');
      }
    }

    // Handle uploaded files for update
    if (req.files) {
      if (req.files.thumbnail && req.files.thumbnail.length > 0) {
        value.thumbnail = req.files.thumbnail[0].url;
      }
      if (req.files.album && req.files.album.length > 0) {
        value.album = req.files.album.map(file => file.url);
      }
    }

    // If title is updated and slug is not provided, re-generate slug
    if (value.title && !value.slug) {
      value.slug = value.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    // Check for slug conflict if slug is being updated or re-generated
    if (value.slug) {
      const existingPost = await postService.getPostBySlug(value.slug);
      if (existingPost && existingPost._id.toString() !== id) {
        return responseUtil.conflictResponse(res, null, 'Slug bài viết đã tồn tại');
      }
    }

    const updatedPost = await postService.updatePost(id, value);
    if (!updatedPost) {
      return responseUtil.notFoundResponse(res, null, 'Không tìm thấy bài viết để cập nhật');
    }
    return responseUtil.successResponse(res, updatedPost, 'Cập nhật bài viết thành công');
  } catch (error) {
    if (error.name === 'CastError') {
      return responseUtil.badRequestResponse(res, null, 'ID bài viết không hợp lệ');
    }
    return responseUtil.errorResponse(res, null, error.message);
  }
};

// Admin - Delete post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPost = await postService.deletePost(id);
    if (!deletedPost) {
      return responseUtil.notFoundResponse(res, null, 'Không tìm thấy bài viết để xóa');
    }
    return responseUtil.successResponse(res, null, 'Xóa bài viết thành công');
  } catch (error) {
    if (error.name === 'CastError') {
      return responseUtil.badRequestResponse(res, null, 'ID bài viết không hợp lệ');
    }
    return responseUtil.errorResponse(res, null, error.message);
  }
};

export default {
  getAllPostsClient,
  getPostsByCategorySlugClient,
  getPostBySlugClient,
  getAllPostsAdmin,
  getPostByIdAdmin,
  createPost,
  updatePost,
  deletePost,
};