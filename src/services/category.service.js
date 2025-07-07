import Category from '../models/category.model.js';
import Product from '../models/product.model.js'; // Assuming product.model.js is in ../models
import parseQueryParams from '../utils/queryParser.util.js';
import slugify from "slugify";
const categoryAllowedFields = {
  name: 'string',
  slug: 'string',
  description: 'string',
};

// Client-side services
const getAllCategoriesClient = async (query) => {
  const { filters, sort, page, limit } = parseQueryParams(
    query,
    categoryAllowedFields,
    [],
    'created_at'
  );
  const options = {
    page,
    limit,
    sort,
    select: '-__v', // Exclude __v from the result
  };
  return await Category.paginate(filters, options);
};

const getCategoryDetailClient = async (slug) => {
  const category = await Category.findOne({ slug }).select('-__v');
  if (!category) {
    return null;
  }
  const products = await Product.find({ category_id: category._id }).select('-__v');
  return { category, products };
};

// Admin-side services
const getAllCategoriesAdmin = async (query) => {
  const { filters, sort, page, limit } = parseQueryParams(
    query,
    categoryAllowedFields,
    [],
    'created_at'
  );
  const options = {
    page,
    limit,
    sort,
    select: '-__v',
  };
  return await Category.paginate(filters, options);
};

const getCategoryByIdAdmin = async (id) => {
  return await Category.findById(id).select('-__v');
};

const createCategory = async (categoryData) => {
  // Check slug trùng (do controller đã tạo slug)
  const existingCategory = await Category.findOne({
    $or: [{ name: categoryData.name }, { slug: categoryData.slug }],
  });
  if (existingCategory) {
    let message = '';
    if (existingCategory.name === categoryData.name) {
      message = 'Tên danh mục đã tồn tại.';
    } else if (existingCategory.slug === categoryData.slug) {
      message = 'Slug danh mục đã tồn tại.';
    }
    throw new Error(message);
  }
  const newCategory = new Category(categoryData);
  return await newCategory.save();
};

const updateCategory = async (id, categoryData) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new Error('Danh mục không tồn tại.');
  }

  // Kiểm tra trùng nếu name đổi → slug cũng đổi
  if (categoryData.name && categoryData.name !== category.name) {
    const newSlug = slugify(categoryData.name, { lower: true, strict: true });

    const nameExists = await Category.findOne({ name: categoryData.name, _id: { $ne: id } });
    if (nameExists) {
      throw new Error('Tên danh mục đã tồn tại.');
    }

    const slugExists = await Category.findOne({ slug: newSlug, _id: { $ne: id } });
    if (slugExists) {
      throw new Error('Slug danh mục đã tồn tại.');
    }

    categoryData.slug = newSlug;
  }

  Object.assign(category, categoryData);
  return await category.save();
};

const deleteCategory = async (id) => {
  // Tìm danh mục để đảm bảo nó tồn tại
  const category = await Category.findById(id);
  if (!category) {
    return null; // Trả về null nếu không tìm thấy danh mục
  }

  // Xóa tất cả sản phẩm thuộc danh mục này
  await Product.deleteMany({ category_id: id });

  // Sau đó, xóa danh mục
  const result = await Category.findByIdAndDelete(id);
  return result;
};
export default {
  // Client
  getAllCategoriesClient,
  getCategoryDetailClient,

  // Admin
  getAllCategoriesAdmin,
  getCategoryByIdAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
};