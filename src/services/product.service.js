import xlsx from "xlsx";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { Product, Variant, Option } from "../models/index.js";
import { logger } from "../config/index.js";

import { productValidate } from "../validations/index.js";
import { slugify } from "../utils/slugify.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getAllProducts = async (page = 1, limit = 10, filters = {}, sort = { createdAt: -1 }) => {
  try {
    logger.info(`Fetching products with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);
    const options = {
      page,
      limit,
      lean: true,
      sort,
    };
    return await Product.paginate(filters, options);
  } catch (error) {
    logger.error(`Failed to get all products: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

const getProductById = async (id) => {
  try {
    logger.info(`Fetching product by ID: ${id}`);
    const product = await Product.findById(id);
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

    // Tính và kiểm tra tồn kho
    let totalStock = 0;
    if (Array.isArray(data.variants) && data.variants.length > 0) {
      for (let variant of data.variants) {
        variant.stock = parseInt(variant.stock) || 0;
        if (variant.stock < 0) {
          throw new Error("Số lượng tồn kho của biến thể không được âm");
        }
        totalStock += variant.stock;
      }
      data.stock = totalStock;
    } else {
      data.stock = parseInt(data.stock) || 0;
      if (data.stock < 0) {
        throw new Error("Tồn kho sản phẩm không được âm");
      }
    }

    // Gán slug nếu chưa có, đảm bảo không trùng
    let slug = slugify(data.name || data.slug);
    let counter = 1;
    while (await Product.findOne({ slug })) {
      slug = slugify(data.name || data.slug) + `-${counter++}`;
    }
    data.slug = slug;

    // Ép kiểu giá trước khi validate
    data.original_price = parseFloat(data.original_price);
    // data.sale_price = parseFloat(data.sale_price);

    // Validate bằng Joi
    const { error } = productValidate.create.validate(data, { abortEarly: false });
    if (error) {
      throw new Error(error.details.map((e) => e.message).join(", "));
    }

    if (data.sale_price > data.original_price) {
      throw new Error("Giá khuyến mãi không được lớn hơn giá gốc");
    }

    // Check trùng mã
    const existingProduct = await Product.findOne({ product_code: data.product_code });
    if (existingProduct) {
      throw new Error("Mã sản phẩm đã tồn tại");
    }

    // ===== Validate options từ collection Option =====
    if (data.options && typeof data.options === "object") {
      const allOptions = await Option.find({});
      const validKeys = allOptions.map((opt) => opt.key);

      for (const [key, values] of Object.entries(data.options)) {
        if (!validKeys.includes(key)) {
          throw new Error(`Option key '${key}' không tồn tại.`);
        }

        const optionDoc = allOptions.find((o) => o.key === key);

        if (key === "color") {
          const colorNamesInDB = optionDoc.values.map((c) => c.name);
          for (const color of values) {
            if (!colorNamesInDB.includes(color.name)) {
              throw new Error(`Màu '${color.name}' không hợp lệ cho option '${key}'.`);
            }
          }
        } else {
          for (const val of values) {
            if (!optionDoc.values.includes(val)) {
              throw new Error(`Giá trị '${val}' không hợp lệ cho option '${key}'.`);
            }
          }
        }
      }
    }

    // ===== Tạo sản phẩm =====
    const product = await Product.create(data);

    // Nếu có biến thể
    if (Array.isArray(data.variants) && data.variants.length > 0) {
      await Promise.all(
        data.variants.map((variant) =>
          Variant.create({
            ...variant,
            product_id: product._id,
          })
        )
      );
    }

    return product;
  } catch (err) {
    logger.error(`Failed to create product: ${err.message}`, { stack: err.stack });
    const error = new Error("Tạo sản phẩm thất bại: " + err.message);
    error.statusCode = 400;
    throw error;
  }
};

const updateProduct = async (id, data) => {
  try {
    logger.info(`Updating product ID ${id}`);

    // Ép kiểu category_id nếu cần
    if (data.category_id && typeof data.category_id === "string" && mongoose.Types.ObjectId.isValid(data.category_id)) {
      data.category_id = new mongoose.Types.ObjectId(data.category_id);
    }

    // Xử lý variants: tính tổng stock
    if (Array.isArray(data.variants) && data.variants.length > 0) {
      let totalStock = 0;
      for (let variant of data.variants) {
        variant.stock = parseInt(variant.stock) || 0;
        if (variant.stock < 0) {
          throw new Error("Tồn kho biến thể không được âm");
        }
        totalStock += variant.stock;
      }
      data.stock = totalStock;
    } else if (typeof data.stock !== "undefined") {
      data.stock = parseInt(data.stock) || 0;
      if (data.stock < 0) {
        throw new Error("Tồn kho sản phẩm không được âm");
      }
    }

    // // Validate logic giá
    // if (data.sale_price && data.original_price && data.sale_price > data.original_price) {
    //   throw new Error('Giá khuyến mãi không được lớn hơn giá gốc');
    // }

    if ("updated_at" in data) {
      delete data.updated_at;
    }

    if (data.options) {
      const allOptions = await Option.find({});

      for (const [key, values] of Object.entries(data.options)) {
        const option = allOptions.find((o) => o.key === key);
        if (!option) continue;

        let validValues = [];

        if (key === "color") {
          validValues = values.filter((v) => option.values.some((ov) => ov.name?.toLowerCase().trim() === v.name?.toLowerCase().trim()));
        } else {
          validValues = values.filter((v) => option.values.includes(v));
        }

        data.options[key] = validValues;
      }
    }

    // Validate bằng Joi nếu muốn (tuỳ chọn)
    const { error } = productValidate.update.validate(data, { abortEarly: false });
    if (error) {
      throw new Error(error.details.map((e) => e.message).join(", "));
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true });
    if (!updatedProduct) {
      logger.warn(`Product not found for update: ${id}`);
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    // Cập nhật lại giá gốc cho tất cả variants nếu original_price thay đổi
    if (data.original_price !== undefined) {
      await Variant.updateMany(
        { product_id: id },
        {
          $set: {
            price: new mongoose.Types.Decimal128(data.original_price.toString()),
          },
        }
      );
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
    const deleted = await Product.findByIdAndDelete(id);
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

const getRelatedProducts = async (productId, limit = 6) => {
  try {
    logger.info(`Fetching related products for product ID: ${productId}`);
    const product = await Product.findById(productId);
    if (!product) {
      logger.warn(`Product not found: ${productId}`);
      throw new Error("Product not found");
    }

    const related = await Product.find({
      _id: { $ne: productId },
      category_id: product.category_id,
    })

      .limit(limit)
      .select("-description");

    return related;
  } catch (error) {
    logger.error(`Failed to get related products: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

const updateProductStatus = async (id, isActive) => {
  try {
    logger.info(`Updating product isActive for ID ${id} to ${isActive}`);

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        isActive,
        is_manual: true, // đánh dấu admin thay đổi thủ công
      },
      { new: true }
    );

    if (!updatedProduct) {
      logger.warn(`Product not found for status update: ${id}`);
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    return updatedProduct;
  } catch (err) {
    logger.error(`Failed to update product status: ${err.message}`, { stack: err.stack });
    throw err;
  }
};

const searchProducts = async (keyword, page = 1, limit = 10) => {
  try {
    logger.info(`Searching products with keyword: ${keyword}`);
    const regex = new RegExp(keyword, "i");
    const filters = {
      $or: [
        { name: { $regex: regex } },
        // { description: { $regex: regex } },
        { tags: { $regex: regex } },
        { product_code: { $regex: regex } },
      ],
    };

    const options = {
      page,
      limit,
      lean: true,
      sort: { createdAt: -1 },
    };

    return await Product.paginate(filters, options);
  } catch (error) {
    logger.error(`Failed to search products: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

const filterProducts = async (filters = {}, page = 1, limit = 10, sort = {}) => {
  try {
    logger.info(`Filtering products with filters: ${JSON.stringify(filters)}`);
    const options = {
      page,
      limit,
      lean: true,
      sort,
    };

    // Xử lý sort
    const sortOptions = {};
    if (sort === "price_asc") {
      sortOptions.price = 1;
    } else if (sort === "price_desc") {
      sortOptions.price = -1;
    } else if (sort === "name_asc") {
      sortOptions.name = 1;
    } else if (sort === "name_desc") {
      sortOptions.name = -1;
    }
    options.sort = sortOptions;

    return await Product.paginate(filters, options);
  } catch (error) {
    logger.error(`Failed to filter products: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

const exportProducts = async (format = "excel") => {
  try {
    const products = await Product.find().lean();

    if (format === "excel") {
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(products);
      xlsx.utils.book_append_sheet(workbook, worksheet, "Products");

      const exportDir = path.join(__dirname, "..", "public", "exports");
      if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

      const filename = `products_exported_${Date.now()}.xlsx`;
      const filePath = path.join(exportDir, filename);

      xlsx.writeFile(workbook, filePath);

      return { path: filePath, filename };
    }

    throw new Error("Invalid format");
  } catch (error) {
    logger.error(`Failed to export products: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

const importProducts = async (file) => {
  if (!file) {
    const error = new Error("No file uploaded");
    error.statusCode = 400;
    throw error;
  }

  const workbook = xlsx.readFile(file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  // Lấy tất cả Option
  const allOptions = await Option.find({});
  const optionMap = {};
  for (const opt of allOptions) {
    optionMap[opt.key] = opt.values;
  }
  const results = [];
  const errors = [];

  for (const item of data) {
    try {
      if (!item["Mã sản phẩm"] || !item["Tên sản phẩm"] || !item["Danh mục"] || !item["Giá gốc"]) {
        throw new Error("Thiếu thông tin bắt buộc");
      }
      // Validate Option
      const options = {};

      // validate color
      if (item["Màu sắc"]) {
        const colorName = item["Màu sắc"].trim();

        const colorOption = optionMap["color"];
        if (!colorOption) {
          throw new Error(`Không tìm thấy option 'color' trong hệ thống`);
        }

        const exist = colorOption.some((val) => val.name.toLowerCase() === colorName.toLowerCase());
        if (!exist) {
          throw new Error(`Giá trị option 'color' không hợp lệ: ${colorName}`);
        }

        // Lưu lại
        const colorObj = colorOption.find((val) => val.name.toLowerCase() === colorName.toLowerCase());
        options["color"] = [colorObj];
      }

      //validate size
      if (item["Kích cỡ"]) {
        const sizeVal = item["Kích cỡ"].trim();

        const sizeOption = optionMap["size"];
        if (!sizeOption) {
          throw new Error(`Không tìm thấy option 'size' trong hệ thống`);
        }

        const exist = sizeOption.includes(sizeVal);
        if (!exist) {
          throw new Error(`Giá trị option 'size' không hợp lệ: ${sizeVal}`);
        }

        options["size"] = [sizeVal];
      }
      const productData = {
        product_code: item["Mã sản phẩm"],
        name: item["Tên sản phẩm"],
        slug: slugify(item["Tên sản phẩm"]),
        category_id: item["Danh mục"],
        original_price: parseFloat(item["Giá gốc"]),
        sale_price: parseFloat(item["Giá khuyến mãi"]) || 0,
        stock: parseInt(item["Số lượng tồn"]) || 0,
        isActive: item["Trạng thái"] === "Có hiệu lực",
        options,
        created_at: new Date(),
        updated_at: new Date(),
      };
      if (item["Images"]) {
        try {
          productData.images = JSON.parse(item["Images"]);
        } catch (err) {
          throw new Error("Cột Images không phải JSON hợp lệ");
        }
      }

      if (item["Tags"]) {
        try {
          productData.tags = JSON.parse(item["Tags"]);
        } catch (err) {
          throw new Error("Cột Tags không phải JSON hợp lệ");
        }
      }

      if (item["Variants"]) {
        try {
          productData.variants = JSON.parse(item["Variants"]);
        } catch (err) {
          console.log(err);
          throw new Error("Cột Variants không phải JSON hợp lệ");
        }
      }
      const product = await Product.create(productData);
      await product.calculateTotalStock();
      results.push(product);
    } catch (err) {
      errors.push({ data: item, error: err.message });
    }
  }

  return { imported: results, errors };
};
const countProducts = async (filters = {}) => {
  try {
    return await Product.countDocuments(filters);
  } catch (error) {
    logger.error(`Failed to count products: ${error.message}`, { stack: error.stack });
    throw error;
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
  countProducts,
};
