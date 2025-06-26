
console.log("🚀 Controller loaded!");import {productService} from '../services/index.js';
// import { exportProducts as exportProductService } from '../services/product.service.js';
import {baseResponse, generateSlug, parseQueryParams} from '../utils/index.js';
import { logger } from '../config/index.js';
import { Product, Variant } from '../models/index.js';
import { slugify } from '../utils/slugify.js';
import fs from 'fs';
console.log("👉 baseResponse type:", typeof baseResponse);
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
    const id = req.params.id;
    logger.info(`[GET] /products/${id} - Get product by ID`);

    const product = await productService.getProductById(id);

    return baseResponse.successResponse(res, product, "Get product successfully");
  } catch (err) {
    logger.error(`[GET] /products/${req.params.id} - Error: ${err.message}`, { stack: err.stack });

    const status = err.statusCode || 500;
    if (status === 404) return baseResponse.notFoundResponse(res, null, err.message);
    if (status === 400) return baseResponse.badRequestResponse(res, null, err.message);

    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const createProduct = async (req, res) => {
  try {
    // Parse variants nếu là chuỗi
    if (typeof req.body.variants === 'string') {
      try {
        req.body.variants = JSON.parse(req.body.variants);
      } catch (e) {
        return baseResponse.badRequestResponse(res, null, "Trường 'variants' không hợp lệ, phải là JSON hợp lệ");
      }
    }

    // Parse options nếu là chuỗi (nếu bạn gửi từ form-data)
    if (typeof req.body.options === 'string') {
      try {
        req.body.options = JSON.parse(req.body.options);
      } catch (e) {
        return baseResponse.badRequestResponse(res, null, "Trường 'options' không hợp lệ, phải là JSON hợp lệ");
      }
    }

    const product = await productService.createProduct(req.body);

    return baseResponse.successResponse(res, product, "Tạo sản phẩm thành công");
  } catch (err) {
    logger.error(`[POST] /products - Error: ${err.message}`, { stack: err.stack });
    return baseResponse.errorResponse(res, null, err.message, err.statusCode || 500);
  }
};



const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(id);
    if (!product) {
      return baseResponse.notFoundResponse(res, null, 'Product not found');
    }

    // Parse variants từ form-data (nếu có dạng `variants[0][...]`)
    if (!req.body.variants && req.body['variants[0][stock]']) {
      const variants = [];
      let i = 0;
      while (req.body[`variants[${i}][stock]`] !== undefined) {
        variants.push({
          size: req.body[`variants[${i}][size]`] || '',
          color: req.body[`variants[${i}][color]`] || '',
          stock: parseInt(req.body[`variants[${i}][stock]`]) || 0,
          image: req.body[`variants[${i}][image]`] || null
        });
        i++;
      }
      req.body.variants = variants;
    }

    // Parse variants nếu là chuỗi JSON
    if (typeof req.body.variants === 'string') {
      try {
        req.body.variants = JSON.parse(req.body.variants);
      } catch (e) {
        return baseResponse.badRequestResponse(res, null, "Trường 'variants' không hợp lệ, phải là JSON hợp lệ");
      }
    }

    // Kiểm tra mã sản phẩm trùng
    if (req.body.product_code && req.body.product_code !== product.product_code) {
      const existing = await Product.findOne({ product_code: req.body.product_code });
      if (existing) {
        return baseResponse.badRequestResponse(res, null, 'Mã sản phẩm đã tồn tại');
      }
    }

    // Cập nhật slug nếu tên thay đổi
    if (req.body.name && req.body.name !== product.name) {
      req.body.slug = slugify(req.body.name);
    }

    // Gọi service để cập nhật sản phẩm
    const updatedProduct = await productService.updateProduct(id, {
      ...req.body,
      updated_at: new Date()
    });

    // ✅ Nếu gửi variants và có cờ overwrite
    if (
      req.body.overwriteVariants === 'true' || req.body.overwriteVariants === true
    ) {
      const variants = Array.isArray(req.body.variants) ? req.body.variants : [];

      // Xoá toàn bộ variant cũ
      await Variant.deleteMany({ product_id: id });

      // Tạo lại
      if (variants.length > 0) {
        await Promise.all(
          variants.map((variant) =>
            Variant.create({
              ...variant,
              product_id: id,
            })
          )
        );
      }
    }

    // Cập nhật lại tổng stock từ variant
    await updatedProduct.calculateTotalStock();

    return baseResponse.successResponse(res, updatedProduct, 'Cập nhật sản phẩm thành công');
  } catch (err) {
    logger.error(`[PUT] /products/${req.params.id} - Error: ${err.message}`, { stack: err.stack });
    return baseResponse.errorResponse(res, null, err.message, err.statusCode || 500);
  }
};


const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Kiểm tra product tồn tại
    const product = await Product.findById(id);
    if (!product) {
      return baseResponse.notFoundResponse(res, null, 'Product not found');
    }

    // Cập nhật trạng thái + đánh dấu là thay đổi thủ công
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        isActive,
        is_manual: true, // admin cập nhật thủ công
        updated_at: new Date()
      },
      { new: true }
    );

    return baseResponse.successResponse(res, updatedProduct, "Update product status successfully");
  } catch (err) {
    logger.error(`[PATCH] /products/${req.params.id}/status - Error: ${err.message}`, { stack: err.stack });
    const status = err.statusCode || 500;
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem product có tồn tại không
    const product = await Product.findById(id);
    if (!product) {
      return baseResponse.notFoundResponse(res, null, 'Product not found');
    }

    // Xóa variants liên quan
    await Variant.deleteMany({ product_id: id });

    // Xóa product
    await Product.findByIdAndDelete(id);

    return baseResponse.successResponse(res, null, "Delete product successfully");
  } catch (err) {
    logger.error(`[DELETE] /products/${req.params.id} - Error: ${err.message}`, { stack: err.stack });
    const status = err.statusCode || 500;
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};
const importProducts = async (req, res) => {
  try {
    console.log("[START] importProducts controller");

    console.log("req.file:", req.file);

    if (!req.file) {
      console.log("❌ Không có file upload (req.file undefined)");
      return baseResponse.badRequestResponse(res, null, 'No file uploaded');
    }

    console.log("Gọi productService.importProducts với file:", req.file.filename);
    const result = await productService.importProducts(req.file);
    console.log("productService.importProducts xử lý xong");

    // Clean up file
  
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log("🧹 Đã xóa file tạm:", req.file.path);
    } else {
      console.log("File path không tồn tại hoặc không tồn tại trên disk:", req.file.path);
    }

    console.log("Trả về kết quả thành công");
    return baseResponse.successResponse(res, result, 'Products imported successfully');
  } catch (err) {
    console.log("[ERROR] Đã xảy ra lỗi trong importProducts:", err.message);
     const status = err.statusCode || 500;
  return baseResponse.errorResponse(res, null, err.message || 'Internal Server Error', status);
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
const searchProducts = async (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;
    const results = await productService.searchProducts(keyword, page, limit);
    return baseResponse.successResponse(res, results, 'Search results');
  } catch (err) {
    logger.error(`[GET] /products/search - Error: ${err.message}`, { stack: err.stack });
    const status = err.statusCode || 500;
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const filterProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = {} } = req.query;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    const results = await productService.filterProducts(filters, page, limit, sort);
    return baseResponse.successResponse(res, results, 'Filtered products');
  } catch (err) {
    logger.error(`[GET] /products/filter - Error: ${err.message}`, { stack: err.stack });
    const status = err.statusCode || 500;
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};

const exportProducts = async (req, res) => {
  try {
    const { format = 'excel' } = req.query;

    // Gọi service để export
    const { path: filePath, filename } = await productService.exportProducts(format);

    // Gửi file về client để tải xuống
    return res.download(filePath, filename);
  } catch (err) {
    logger.error(`[GET] /products/export - Error: ${err.message}`, { stack: err.stack });
    const status = err.statusCode || 500;
    return baseResponse.errorResponse(res, null, err.message, status);
  }
};
const setOptions = async (req, res) => {
  // console.log("🟡 Dữ liệu nhận được từ client:", JSON.stringify(options, null, 2));

  try {
    const { productId } = req.params;
    const { options } = req.body;
  console.log("🟡 Dữ liệu nhận được từ client:", JSON.stringify(options, null, 2));
    if (!options || typeof options !== 'object') {
      return baseResponse.badRequestResponse(res, null, 'Thiếu hoặc sai định dạng options');
    }

    const product = await Product.findById(productId);
    if (!product) {
      return baseResponse.notFoundResponse(res, null, 'Không tìm thấy sản phẩm');
    }

    // Đảm bảo product.options là object thường
    if (!product.options || typeof product.options !== 'object') {
      product.options = { size: [], color: [] };
    }

    // ===== Normalize SIZE =====
    const normalizeSizes = (arr) =>
      Array.isArray(arr)
        ? arr
            .filter(v => typeof v === 'string' && v.trim())
            .map(v => v.trim().toUpperCase())
        : [];

    const addUniqueSizes = (existing, incoming) => {
      const existingSet = new Set((existing || []).map(s => s.toUpperCase()));
      return [...(existing || []), ...incoming.filter(s => !existingSet.has(s.toUpperCase()))];
    };

    const newSizes = normalizeSizes(options.size);
    product.options.size = addUniqueSizes(product.options.size, newSizes);
    product.markModified('options.size');
    // ===== Normalize COLOR =====
    const capitalize = (str) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    const normalizeColors = (arr) =>
      Array.isArray(arr)
        ? arr
            .filter(v => v && typeof v === 'object' && typeof v.name === 'string')
            .map(v => ({
              name: capitalize(v.name.trim()),
              hex: (typeof v.hex === 'string' ? v.hex.trim().toUpperCase() : '#CCCCCC')
            }))
        : [];

    const addUniqueColors = (existing, incoming) => {
      const map = new Map();

      (Array.isArray(existing) ? existing : []).forEach(c => {
        if (c && c.name) {
          map.set(c.name.toLowerCase(), {
            name: capitalize(c.name),
            hex: typeof c.hex === 'string' ? c.hex.trim().toUpperCase() : '#CCCCCC'
          });
        }
      });

      incoming.forEach(c => {
        const key = c.name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, c);
        } else {
          const existingColor = map.get(key);
          if (c.hex && c.hex !== existingColor.hex) {
            map.set(key, { name: c.name, hex: c.hex }); // cập nhật hex nếu khác
          }
        }
      });

      return Array.from(map.values());
    };

    const newColors = normalizeColors(options.color);
    product.options.color = addUniqueColors(product.options.color, newColors);
product.markModified('options.color');
    // Lưu DB
    await product.save();
// Lưu DB
// const result = await product.save();

// 👉 THÊM LOG Ở ĐÂY
console.log("✅ Product updated:", {
  id: product._id.toString(),
  size: product.options.size,
  color: product.options.color
});
    return baseResponse.successResponse(res, product.options, 'Cập nhật thuộc tính thành công');
  } catch (err) {
    return baseResponse.errorResponse(res, null, err.message || 'Đã có lỗi xảy ra');
  }
};

const getOptions = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).select('options');
    if (!product) {
      return baseResponse.notFoundResponse(res, null, 'Không tìm thấy sản phẩm');
    }

    return baseResponse.successResponse(res, product.options, 'Lấy options thành công');
  } catch (err) {
    logger.error(`[GET] /products/${req.params.productId}/options - Error: ${err.message}`, { stack: err.stack });
    return baseResponse.errorResponse(res, null, err.message || 'Đã xảy ra lỗi');
  }
};






export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  searchProducts,
  filterProducts,
  exportProducts,
  importProducts,
  getRelatedProducts,
  // setOptions
  getOptions
};

