import {productService} from '../services/index.js';
import {baseResponse, parseQueryParams} from '../utils/index.js';
import {productValidate} from '../validations/index.js';

const getAllProducts = async (req, res) => {
  try {
   const allowedFields = {
      name: 'string',
      category_id: 'exact',
      tags: 'array',
      color: 'exact',
      size: 'exact',
    };
    const { filters, sort, page, limit } = parseQueryParams(req.query, allowedFields);

    const products = await productService.getAllProducts(page, limit, filters, sort);

    return baseResponse.successResponse(res, products, "Lấy danh sách sản phẩm thành công");
  } catch (err) {
    const status = err.statusCode || 500;
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return baseResponse.successResponse(res, product, "Lấy sản phẩm thành công");
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 404) return baseResponse.notFoundResponse(res, null, err.message);
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const createProduct = async (req, res) => {
  const { error } = productValidate.createSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return baseResponse.badRequestResponse(res, null, error.details.map(e => e.message).join(', '));
  }
  try {
    const newProduct = await productService.createProduct(req.body);
    return baseResponse.createdResponse(res, newProduct, "Tạo sản phẩm thành công");
  } catch (err) {
    const status = err.statusCode || 500;
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const updateProduct = async (req, res) => {
  const { error } = productValidate.updateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return baseResponse.badRequestResponse(res, null, error.details.map(e => e.message).join(', '));
  }
  try {
    const updatedProduct = await productService.updateProduct(req.params.id, req.body);
    return baseResponse.successResponse(res, updatedProduct, "Cập nhật sản phẩm thành công");
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 404) return baseResponse.notFoundResponse(res, null, err.message);
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    return baseResponse.successResponse(res, null, "Xóa sản phẩm thành công");
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 404) return baseResponse.notFoundResponse(res, null, err.message);
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
