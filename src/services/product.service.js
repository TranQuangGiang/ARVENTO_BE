import xlsx from 'xlsx';
import mongoose from 'mongoose';
import fs from 'fs';

import { productModel } from "../models/index.js";
import { logger } from "../config/index.js";

const getAllProducts = async (page = 1, limit = 10, filters = {}, sort = { createdAt: -1 }) => {
  try {
    logger.info(`Fetching products with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);
    const options = {
      page,
      limit,
      lean: true,
      sort,
    };
    return await productModel.paginate(filters, options);
  } catch (error) {
    logger.error(`Failed to get all products: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

const getProductById = async (id) => {
  try {
    logger.info(`Fetching product by ID: ${id}`);
    const product = await productModel.findById(id);
    if (!product) {
      logger.warn(`Product not found: ${id}`);
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }
    return product;
  } catch (error) {
    logger.error(`Failed to get product by ID: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

const createProduct = async (data) => {
  try {
    logger.info(`Creating product: ${JSON.stringify(data)}`);
    const newProduct = new productModel(data);
    return await newProduct.save();
  } catch (err) {
    logger.error(`Failed to create product: ${err.message}`, { stack: err.stack });
    const error = new Error("Create product failed: " + err.message);
    error.statusCode = 400;
    throw error;
  }
};

const updateProduct = async (id, data) => {
  try {
    logger.info(`Updating product ID ${id}`);
    const updatedProduct = await productModel.findByIdAndUpdate(id, data, { new: true });
    if (!updatedProduct) {
      logger.warn(`Product not found for update: ${id}`);
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }
    return updatedProduct;
  } catch (err) {
    logger.error(`Failed to update product: ${err.message}`, { stack: err.stack });
    throw err;
  }
};

const deleteProduct = async (id) => {
  try {
    logger.info(`Deleting product ID: ${id}`);
    const deleted = await productModel.findByIdAndDelete(id);
    if (!deleted) {
      logger.warn(`Product not found for deletion: ${id}`);
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }
    return deleted;
  } catch (err) {
    logger.error(`Failed to delete product: ${err.message}`, { stack: err.stack });
    throw err;
  }
};

const importProductsFromExcel = async (filePath) => {
  try {
    logger.info(`Importing products from Excel file: ${filePath}`);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const products = xlsx.utils.sheet_to_json(sheet);

    const productDocs = products.map(item => {
      if (!item.name || !item.category_id || !item.price || !item.stock || !item.slug) {
        throw new Error(`Missing required fields in product: ${JSON.stringify(item)}`);
      }

      return {
        name: item.name,
        category_id: mongoose.Types.ObjectId(item.category_id),
        slug: item.slug,
        description: item.description || '',
        price: mongoose.Types.Decimal128.fromString(item.price.toString()),
        stock: Number(item.stock),
        images: item.images ? item.images.split(',').map(i => i.trim()) : [],
        variants: item.variants ? JSON.parse(item.variants) : [],
        tags: item.tags ? item.tags.split(',').map(t => t.trim()) : [],
      };
    });

    const result = await productModel.insertMany(productDocs);

    fs.unlinkSync(filePath);
    logger.info(`Successfully imported ${result.length} products from Excel`);
    return {
      message: `Successfully imported ${result.length} products`,
      importedCount: result.length,
    };
  } catch (error) {
    logger.error(`Failed to import products: ${error.message}`, { stack: error.stack });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

const getRelatedProducts = async (productId, limit = 6) => {
  try {
    logger.info(`Fetching related products for product ID: ${productId}`);
    const product = await productModel.findById(productId);
    if (!product) {
      logger.warn(`Product not found: ${productId}`);
      throw new Error("Product not found");
    }

    const related = await productModel.find({
      _id: { $ne: productId },
      category_id: product.category_id
    })
      .limit(limit)
      .select('-description');

    return related;
  } catch (error) {
    logger.error(`Failed to get related products: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  importProductsFromExcel,
  getRelatedProducts
};
