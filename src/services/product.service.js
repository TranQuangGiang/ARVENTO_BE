import { productModel } from "../models/index.js";
import xlsx from 'xlsx';
import mongoose from 'mongoose';
import fs from 'fs';

const getAllProducts = async (page = 1, limit = 10, filters = {}, sort = { createdAt: -1 }) => {
  const options = {
    page,
    limit,
    lean: true,
    sort,
  };
  const result = await productModel.paginate(filters, options);
  return result;
};

const getProductById = async (id) => {
  const product = await productModel.findById(id);
  if (!product) {
    const error = new Error("Không tìm thấy sản phẩm");
    error.statusCode = 404;
    throw error;
  }
  return product;
};

const createProduct = async (data) => {
  try {
    const newProduct = new productModel(data);
    return await newProduct.save();
  } catch (err) {
    const error = new Error("Tạo sản phẩm thất bại: " + err.message);
    error.statusCode = 400;
    throw error;
  }
};

const updateProduct = async (id, data) => {
  const updatedProduct = await productModel.findByIdAndUpdate(id, data, { new: true });
  if (!updatedProduct) {
    const error = new Error("Không tìm thấy sản phẩm");
    error.statusCode = 404;
    throw error;
  }
  return updatedProduct;
};

const deleteProduct = async (id) => {
  const deleted = await productModel.findByIdAndDelete(id);
  if (!deleted) {
    const error = new Error("Không tìm thấy sản phẩm");
    error.statusCode = 404;
    throw error;
  }
  return deleted;
};

 const importProductsFromExcel = async (filePath) => {
  try {
    // real file Excel
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // convert sheet to json
    const products = xlsx.utils.sheet_to_json(sheet);

    // Validate, map data
    const productDocs = products.map(item => {
      // Validate 
      if (!item.name || !item.category_id || !item.price || !item.stock || !item.slug) {
        throw new Error(`Thiếu trường bắt buộc ở sản phẩm: ${JSON.stringify(item)}`);
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

    return {
      message: `Import success ${result.length} products`,
      importedCount: result.length,
    };
  } catch (error) {

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;  
  }
};
export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  importProductsFromExcel
};
