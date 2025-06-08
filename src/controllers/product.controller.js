import {productService} from '../services/index.js';
import {baseResponse, generateSlug, parseQueryParams} from '../utils/index.js';
import {productValidate} from '../validations/index.js';
import { logger } from '../config/index.js';

const getAllProducts = async (req, res) => {
  try {
   logger.info(`[GET] /products - Query: ${JSON.stringify(req.query)}`);
   const allowedFields = {
      name: 'string',
      category_id: 'exact',
      tags: 'array',
      color: 'exact',
      size: 'exact',
    };
    const { filters, sort, page, limit } = parseQueryParams(req.query, allowedFields);

    const result = await productService.getAllProducts(page, limit, filters, sort);

    return baseResponse.successResponse(res, result, "Get product list successfully");
  } catch (err) {
    logger.error(`[GET] /products - Error: ${err.message}`, { stack: err.stack });
    const status = err.statusCode || 500;
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const getProductById = async (req, res) => {
  try {
    logger.info(`[GET] /products/${req.params.id} - Get product by ID`);

    const product = await productService.getProductById(req.params.id);

    return baseResponse.successResponse(res, product, "Get product successfully");
  } catch (err) {
    logger.error(`[GET] /products/${req.params.id} - Error: ${err.message}`, { stack: err.stack });

    const status = err.statusCode || 500;
    if (status === 404) return baseResponse.notFoundResponse(res, null, err.message);
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const createProduct = async (req, res) => {
  logger.info(`[POST] /products - Create product request`);

  let data = req.body; 

  if (!req.body.slug && data.name) {
    data.slug = generateSlug(data.name);
  }

  const { error } = productValidate.create.validate(req.body, { abortEarly: false });
  if (error) {
    return baseResponse.badRequestResponse(res, null, error.details.map(e => e.message).join(', '));
  }

  try {
    const newProduct = await productService.createProduct(req.body);

    return baseResponse.createdResponse(res, newProduct, "Create product successfully");
  } catch (err) {
    logger.error(`[POST] /products - Error: ${err.message}`, { stack: err.stack });

    const status = err.statusCode || 500;
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const updateProduct = async (req, res) => {
  logger.info(`[PUT] /products/${req.params.id} - Update product request`);

  const { error } = productValidate.update.validate(req.body, { abortEarly: false });
  if (error) {
    return baseResponse.badRequestResponse(res, null, error.details.map(e => e.message).join(', '));
  }

  try {
    const updatedProduct = await productService.updateProduct(req.params.id, req.body);

    return baseResponse.successResponse(res, updatedProduct, "Update product successfully");
  } catch (err) {
    logger.error(`[PUT] /products/${req.params.id} - Error: ${err.message}`, { stack: err.stack });

    const status = err.statusCode || 500;
    if (status === 404) return baseResponse.notFoundResponse(res, null, err.message);
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const deleteProduct = async (req, res) => {
  logger.info(`[DELETE] /products/${req.params.id} - Delete product request`);

  try {
    await productService.deleteProduct(req.params.id);

    return baseResponse.successResponse(res, null, "Delete product successfully");
  } catch (err) {
    logger.error(`[DELETE] /products/${req.params.id} - Error: ${err.message}`, { stack: err.stack });

    const status = err.statusCode || 500;
    if (status === 404) return baseResponse.notFoundResponse(res, null, err.message);
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};
const importProducts = async (req, res) => {
  logger.info(`[POST] /products/import - Import products from Excel`);

  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload file Excel' });

    const result = await productService.importProductsFromExcel(req.file.path);

    return res.json(result);
  } catch (error) {
    logger.error(`[POST] /products/import - Error: ${error.message}`, { stack: error.stack });

    return res.status(500).json({ message: error.message || 'Error import product' });
  }
};

const getRelatedProducts = async (req, res) => {
  try {
    logger.info(`[GET] /products/${req.params.id}/related - Get related products`);

    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const result = await productService.getRelatedProducts(id, limit);

    return baseResponse.successResponse(res, result, "Get related products successfully");
  } catch (err) {
    logger.error(`[GET] /products/${req.params.id}/related - Error: ${err.message}`, { stack: err.stack });

    const status = err.statusCode || 500;
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  importProducts,
  getRelatedProducts,
};
