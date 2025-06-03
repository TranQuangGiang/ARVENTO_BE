
import categoryPostService from '../services/categoryPost.service.js';
import responseUtil from '../utils/response.util.js';
import { categoryPostValidation } from '../validations/index.js';

// Admin - Get all categories
const getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await categoryPostService.getAllCategories();
    return responseUtil.successResponse(res, categories, 'Lấy tất cả danh mục thành công');
  } catch (error) {
    return responseUtil.errorResponse(res, null, error.message);
  }
};

// Client - Get all categories (published/active categories if applicable)
const getAllCategoriesClient = async (req, res) => {
  try {
    const categories = await categoryPostService.getAllCategories();
    return responseUtil.successResponse(res, categories, 'Lấy tất cả danh mục thành công');
  } catch (error) {
    return responseUtil.errorResponse(res, null, error.message);
  }
};

// Admin - Get category by ID
const getCategoryByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryPostService.getCategoryById(id);
    if (!category) {
      return responseUtil.notFoundResponse(res, null, 'Không tìm thấy danh mục');
    }
    return responseUtil.successResponse(res, category, 'Lấy danh mục theo ID thành công');
  } catch (error) {
    if (error.name === 'CastError') {
      return responseUtil.badRequestResponse(res, null, 'ID danh mục không hợp lệ');
    }
    return responseUtil.errorResponse(res, null, error.message);
  }
};

// Admin - Create new category
const createCategory = async (req, res) => {
  try {
    const { error, value } = categoryPostValidation.createCategoryPostSchema.validate(req.body);
    if (error) {
      return responseUtil.validationErrorResponse(res, error.details);
    }

    // Check if category name or slug already exists
    const existingCategoryByName = await categoryPostService.getCategoryBySlug(value.name); // Using name for slug generation check
    const existingCategoryBySlug = value.slug ? await categoryPostService.getCategoryBySlug(value.slug) : null;

    if (existingCategoryByName || existingCategoryBySlug) {
      return responseUtil.conflictResponse(res, null, 'Tên danh mục hoặc slug đã tồn tại');
    }

    const newCategory = await categoryPostService.createCategory(value);
    return responseUtil.createdResponse(res, newCategory, 'Tạo danh mục mới thành công');
  } catch (error) {
    return responseUtil.errorResponse(res, null, error.message);
  }
};

// Admin - Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = categoryPostValidation.updateCategoryPostSchema.validate(req.body);
    if (error) {
      return responseUtil.validationErrorResponse(res, error.details);
    }

    if (Object.keys(value).length === 0) {
      return responseUtil.badRequestResponse(res, null, 'Không có dữ liệu để cập nhật');
    }

    // If name is updated, check for conflict with existing slugs (auto-generated or manually set)
    if (value.name) {
      const existingCategory = await categoryPostService.getCategoryBySlug(value.name);
      if (existingCategory && existingCategory._id.toString() !== id) {
        return responseUtil.conflictResponse(res, null, 'Tên danh mục đã tồn tại');
      }
    }

    // If slug is explicitly updated, check for conflict
    if (value.slug) {
      const existingCategory = await categoryPostService.getCategoryBySlug(value.slug);
      if (existingCategory && existingCategory._id.toString() !== id) {
        return responseUtil.conflictResponse(res, null, 'Slug danh mục đã tồn tại');
      }
    }

    const updatedCategory = await categoryPostService.updateCategory(id, value);
    if (!updatedCategory) {
      return responseUtil.notFoundResponse(res, null, 'Không tìm thấy danh mục để cập nhật');
    }
    return responseUtil.successResponse(res, updatedCategory, 'Cập nhật danh mục thành công');
  } catch (error) {
    if (error.name === 'CastError') {
      return responseUtil.badRequestResponse(res, null, 'ID danh mục không hợp lệ');
    }
    return responseUtil.errorResponse(res, null, error.message);
  }
};

// Admin - Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await categoryPostService.deleteCategory(id);
    if (!deletedCategory) {
      return responseUtil.notFoundResponse(res, null, 'Không tìm thấy danh mục để xóa');
    }
    return responseUtil.successResponse(res, null, 'Xóa danh mục thành công');
  } catch (error) {
    if (error.name === 'CastError') {
      return responseUtil.badRequestResponse(res, null, 'ID danh mục không hợp lệ');
    }
    return responseUtil.errorResponse(res, null, error.message);
  }
};

export default {
  getAllCategoriesAdmin,
  getAllCategoriesClient,
  getCategoryByIdAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
};