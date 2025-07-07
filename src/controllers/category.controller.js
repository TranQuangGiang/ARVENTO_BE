import categoryService from '../services/category.service.js';
import responseUtil from '../utils/response.util.js';
import { createCategorySchema, updateCategorySchema } from '../validations/category.validation.js';
import baseResponse from '../utils/response.util.js';
import slugify from 'slugify';
import Category from '../models/category.model.js';
// Client-side controllers
const getAllCategoriesForClient = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategoriesClient(req.query);
    return responseUtil.successResponse(res, categories.docs, 'Lấy danh sách danh mục thành công.', 200, {
      pagination: {
        totalDocs: categories.totalDocs,
        limit: categories.limit,
        totalPages: categories.totalPages,
        page: categories.page,
        pagingCounter: categories.pagingCounter,
        hasPrevPage: categories.hasPrevPage,
        hasNextPage: categories.hasPrevPage,
        prevPage: categories.prevPage,
        nextPage: categories.nextPage,
      },
    });
  } catch (error) {
    console.error(error);
    return responseUtil.errorResponse(res, null, error.message || 'Lỗi lấy danh sách danh mục.');
  }
};

const getCategoryDetailForClient = async (req, res) => {
  try {
    const { slug } = req.params;
    const data = await categoryService.getCategoryDetailClient(slug);
    if (!data) {
      return responseUtil.notFoundResponse(res, null, 'Không tìm thấy danh mục hoặc sản phẩm liên quan.');
    }
    return responseUtil.successResponse(res, data, 'Lấy chi tiết danh mục và sản phẩm thành công.');
  } catch (error) {
    console.error(error);
    return responseUtil.errorResponse(res, null, error.message || 'Lỗi lấy chi tiết danh mục.');
  }
};


// Admin-side controllers
const getAllCategoriesForAdmin = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategoriesAdmin(req.query);
    return responseUtil.successResponse(res, categories.docs, 'Lấy danh sách tất cả danh mục thành công.', 200, {
      pagination: {
        totalDocs: categories.totalDocs,
        limit: categories.limit,
        totalPages: categories.totalPages,
        page: categories.page,
        pagingCounter: categories.pagingCounter,
        hasPrevPage: categories.hasPrevPage,
        hasNextPage: categories.hasPrevPage,
        prevPage: categories.prevPage,
        nextPage: categories.nextPage,
      },
    });
  } catch (error) {
    console.error(error);
    return responseUtil.errorResponse(res, null, error.message || 'Lỗi lấy danh sách tất cả danh mục.');
  }
};

const getCategoryByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryByIdAdmin(id);
    if (!category) {
      return responseUtil.notFoundResponse(res, null, 'Không tìm thấy danh mục.');
    }
    return responseUtil.successResponse(res, category, 'Lấy chi tiết danh mục thành công.');
  } catch (error) {
    console.error(error);
    return responseUtil.errorResponse(res, null, error.message || 'Lỗi lấy chi tiết danh mục.');
  }
};

const createCategory = async (req, res) => {
  try {
    const data = req.body;

    if (req.file) {
      data.image = {
        url: req.file.url,
        alt: req.file.originalname.split(".")[0]
      };
    }

    // Bỏ slug nếu client gửi lên
    delete data.slug;

    data.slug = slugify(data.name, { lower: true, strict: true });

    const category = await categoryService.createCategory(data);
    return baseResponse.successResponse(res, category, "Tạo category thành công");
  } catch (err) {
    return baseResponse.errorResponse(res, null, err.message);
  }
};

const updateCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    if (req.file) {
      data.image = {
        url: req.file.url,
        alt: req.file.originalname.split(".")[0]
      };
    }

    // Bỏ slug nếu client gửi lên
    delete data.slug;

    if (data.name) {
      data.slug = slugify(data.name, { lower: true, strict: true });
    }

    const updated = await categoryService.updateCategory(id, data);
    return baseResponse.successResponse(res, updated, "Cập nhật category thành công");
  } catch (err) {
    return baseResponse.errorResponse(res, null, err.message);
  }
};


const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await categoryService.deleteCategory(id);
    if (!result) {
      return responseUtil.notFoundResponse(res, null, 'Không tìm thấy danh mục để xóa.');
    }
    return responseUtil.successResponse(res, null, 'Xóa danh mục thành công.');
  } catch (error) {
    console.error(error);
    if (error.message.includes('Không thể xóa danh mục này')) {
      return responseUtil.badRequestResponse(res, null, error.message);
    }
    return responseUtil.errorResponse(res, null, error.message || 'Lỗi xóa danh mục.');
  }
};

export default {
  // Client
  getAllCategoriesForClient,
  getCategoryDetailForClient,

  // Admin
  getAllCategoriesForAdmin,
  getCategoryByIdForAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
};