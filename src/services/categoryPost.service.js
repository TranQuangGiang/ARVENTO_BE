
import CategoryPost from '../models/categoryPost.model.js';

const getAllCategories = async () => {
  return await CategoryPost.find();
};

const getCategoryById = async (id) => {
  return await CategoryPost.findById(id);
};

const getCategoryBySlug = async (slug) => {
  return await CategoryPost.findOne({ slug });
};

const createCategory = async (categoryData) => {
  const newCategory = new CategoryPost(categoryData);
  return await newCategory.save();
};

const updateCategory = async (id, updateData) => {
  return await CategoryPost.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteCategory = async (id) => {
  return await CategoryPost.findByIdAndDelete(id);
};

export default {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};