// src/services/post.service.js
import Post from '../models/post.model.js';

const getAllPosts = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { created_at: -1 } } = options;
  return await Post.paginate(filter, {
    page,
    limit,
    sort,
    populate: { path: 'category', select: 'name slug' }, 
  });
};

const getPostById = async (id) => {
  return await Post.findById(id).populate('category', 'name slug').populate('author', 'username');
};

const getPostBySlug = async (slug) => {
  return await Post.findOne({ slug }).populate('category', 'name slug').populate('author', 'username');
};

const getPostsByCategory = async (categoryId, options = {}) => {
  const { page = 1, limit = 10, sort = { created_at: -1 } } = options;
  return await Post.paginate({ category: categoryId, status: 'published' }, {
    page,
    limit,
    sort,
    populate: { path: 'category', select: 'name slug' },
  });
};

const createPost = async (postData) => {
  const newPost = new Post(postData);
  return await newPost.save();
};

const updatePost = async (id, updateData) => {
  return await Post.findByIdAndUpdate(id, updateData, { new: true });
};

const deletePost = async (id) => {
  return await Post.findByIdAndDelete(id);
};

const incrementViewCount = async (id) => {
  return await Post.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true });
};

export default {
  getAllPosts,
  getPostById,
  getPostBySlug,
  getPostsByCategory,
  createPost,
  updatePost,
  deletePost,
  incrementViewCount,
};