import { productModel } from "../models/index.js";

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

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};