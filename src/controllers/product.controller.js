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

    const result = await productService.getAllProducts(page, limit, filters, sort);

     const responseData = {
      ...result,
      data: result.docs,
    };
    delete responseData.docs;

    return baseResponse.successResponse(res, responseData, "Get product list successfully");
  } catch (err) {
    const status = err.statusCode || 500;
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return baseResponse.successResponse(res, product, "Get product successfully");
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 404) return baseResponse.notFoundResponse(res, null, err.message);
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const createProduct = async (req, res) => {
  const { error } = productValidate.create.validate(req.body, { abortEarly: false });
  if (error) {
    return baseResponse.badRequestResponse(res, null, error.details.map(e => e.message).join(', '));
  }
  try {
    const newProduct = await productService.createProduct(req.body);
    return baseResponse.createdResponse(res, newProduct, "Create product successfully");
  } catch (err) {
    const status = err.statusCode || 500;
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const updateProduct = async (req, res) => {
  const { error } = productValidate.update.validate(req.body, { abortEarly: false });
  if (error) {
    return baseResponse.badRequestResponse(res, null, error.details.map(e => e.message).join(', '));
  }
  try {
    const updatedProduct = await productService.updateProduct(req.params.id, req.body);
    return baseResponse.successResponse(res, updatedProduct, "Update product successfully");
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 404) return baseResponse.notFoundResponse(res, null, err.message);
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    return baseResponse.successResponse(res, null, "Delete product successfully");
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 404) return baseResponse.notFoundResponse(res, null, err.message);
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const importProducts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload file Excel' });

    const result = await productService.importProductsFromExcel(req.file.path);

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error import product' });
  }
};
export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  importProducts
};
