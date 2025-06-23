import mongoose from 'mongoose';
import Variant from '../models/variant.model.js';
import Product from '../models/product.model.js';
import xlsx from 'xlsx';
import fs from 'fs';
const getCombinations = (options) => {
  const keys = Object.keys(options);
  return keys.reduce((acc, key) => {
    const values = options[key];
    return acc.flatMap(item => values.map(value => ({ ...item, [key]: value })));
  }, [{}]);
};

const generateVariants = async (productId, input) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Không tìm thấy sản phẩm');

  const inputOptions = input.options || {};
  const overwrite = input.overwrite === true;
  const images = input.images || {};

  const basePrice =
    product.sale_price && parseFloat(product.sale_price.toString()) > 0
      ? parseFloat(product.sale_price.toString())
      : parseFloat(product.original_price.toString());

  // 🔒 VALIDATE options với product.options
  const validSizes = product.options?.size || [];
  const validColors = (product.options?.color || [])
    .filter(c => c && typeof c.name === 'string')
    .map(c => c.name.toLowerCase());

  const inputSizes = (inputOptions.size || [])
    .filter(s => typeof s === 'string' && s.trim())
    .map(s => s.trim().toUpperCase());

  const inputColors = (inputOptions.color || [])
    .filter(c => c && typeof c.name === 'string')
    .map(c => c.name.toLowerCase());

  const invalidSizes = inputSizes.filter(s => !validSizes.includes(s));
  const invalidColors = inputColors.filter(c => !validColors.includes(c));

  if (invalidSizes.length || invalidColors.length) {
    throw new Error(`Options không hợp lệ: ${
      invalidSizes.length ? 'Size: ' + invalidSizes.join(', ') : ''
    } ${
      invalidColors.length ? 'Color: ' + invalidColors.join(', ') : ''
    }`);
  }

  //  Nếu overwrite, xoá toàn bộ biến thể cũ
  if (overwrite) {
    await Variant.deleteMany({ product_id: productId });
  }

  //  Sinh các tổ hợp size–color từ input
  const combinations = getCombinations(inputOptions);

  //  Lấy danh sách biến thể đã tồn tại (nếu không overwrite)
  const existingVariants = overwrite
    ? []
    : await Variant.find({ product_id: productId });

  const existingKeys = new Set(
    existingVariants.map(v => {
      const sizeKey = typeof v.size === 'string' ? v.size.toLowerCase() : '';
      const colorKey =
        typeof v.color === 'string'
          ? v.color.toLowerCase()
          : typeof v.color === 'object' && typeof v.color.name === 'string'
          ? v.color.name.toLowerCase()
          : '';
      return `${sizeKey}-${colorKey}`;
    })
  );

  // Tạo danh sách biến thể chưa tồn tại
  const variants = combinations
    .filter(({ size, color }) => {
  const colorKey = typeof color === 'object' && typeof color.name === 'string'
    ? color.name.toLowerCase()
    : (typeof color === 'string' ? color.toLowerCase() : '');

  const sizeKey = typeof size === 'string' ? size.toLowerCase() : '';
  const key = `${sizeKey}-${colorKey}`;
  return !existingKeys.has(key);
})
   .map(({ size, color }) => {
  const colorName =
    typeof color === 'object' && typeof color.name === 'string'
      ? color.name
      : (typeof color === 'string' ? color : '');

  const matchedColor = (product.options.color || []).find(
    c => c.name.toLowerCase() === colorName.toLowerCase()
  );

  const img = images[colorName] || {
    url: '',
    alt: `${colorName} ${size || ''}`.trim()
  };

  return {
    product_id: productId,
    size,
    color: {
      name: colorName,
      hex: matchedColor?.hex || '#CCCCCC'
    },
    sku: `VAR-${size || 'N'}-${colorName || 'N'}-${Date.now()}`,
    stock: 0,
    price: basePrice,
    image: img
  };
});

  // 📭 Không có biến thể mới → trả về rỗng
  if (!variants.length) return [];

  const created = await Variant.insertMany(variants);
  await product.calculateTotalStock();
  return created;
};

const updateVariant = async (productId, id, update) => {
  const updated = await Variant.findOneAndUpdate({ _id: id, product_id: productId }, update, { new: true, runValidators: true });
  if (!updated) throw new Error('Không tìm thấy biến thể');
  await Product.findById(productId)?.then(p => p?.calculateTotalStock());
  return updated;
};

const bulkUpdateVariants = async (productId, updates) => {
  const results = [];
  for (const { id, ...data } of updates) {
    const updated = await Variant.findOneAndUpdate({ _id: id, product_id: productId }, data, { new: true, runValidators: true });
    if (updated) results.push(updated);
  }
  await Product.findById(productId)?.then(p => p?.calculateTotalStock());
  return results;
};

const deleteVariant = async (productId, id) => {
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error('ID không hợp lệ');
  }

  const variant = await Variant.findOne({
    _id: new mongoose.Types.ObjectId(id),
    product_id: new mongoose.Types.ObjectId(productId),
  });

  if (!variant) {
    throw new Error('Không tìm thấy biến thể');
  }

  await variant.deleteOne(); // hoặc variant.remove() nếu cần trigger middleware

  const product = await Product.findById(productId);
  if (product) {
    await product.calculateTotalStock();
  }
};


const deleteAllVariants = async (productId) => {
  await Variant.deleteMany({ product_id: productId });
  await Product.findById(productId)?.then(p => p?.calculateTotalStock());
};

const importVariants = async (productId, filePath, variantImages = {}) => {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const variants = rows.map(row => {
    const image = variantImages[row.sku] || {
      url: row.image_url || 'https://placehold.co/300x300',
      alt: row.image_alt || `${row.size}-${row.color}`,
    };

    return {
      product_id: productId,
      size: row.size,
      color: row.color,
      sku: row.sku,
      stock: row.stock || 0,
      price: row.price,
      image,
    };
  });

  const inserted = await Variant.insertMany(variants);
  fs.unlinkSync(filePath);
  await Product.findById(productId)?.then(p => p?.calculateTotalStock());
  return inserted;
};

const exportVariants = async (productId) => {
  const variants = await Variant.find({ product_id: productId });
  const data = variants.map(v => ({
    size: v.size,
    color: v.color,
    sku: v.sku,
    stock: v.stock,
    price: v.price,
    image_url: v.image?.url,
    image_alt: v.image?.alt
  }));
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Variants');
  const filePath = `./exports/variants-${productId}.xlsx`;
  xlsx.writeFile(wb, filePath);
  return filePath;
};

const cleanupExportedFile = (filePath) => {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};
const getVariantById = async (productId, id) => {
  const variant = await Variant.findOne({ _id: id, product_id: productId });
  if (!variant) throw new Error('Không tìm thấy biến thể');
  return variant;
};
const getVariantOptions = async (productId) => {
  const variants = await Variant.find({ product_id: productId });
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
  return { sizes, colors };
};
const getAdminVariants = async (productId, query = {}) => {
  const {
    page = 1,
    limit = 10,
    size,
    colorName,
    populateProduct = false
  } = query;

  const skip = (Number(page) - 1) * Number(limit);

  const filter = {
    product_id: productId
  };

  if (size) {
    filter.size = size;
  }

  if (colorName) {
    filter['color.name'] = { $regex: new RegExp(colorName, 'i') }; // tìm không phân biệt hoa thường
  }

  let queryExec = Variant.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  if (populateProduct) {
    queryExec = queryExec.populate('product_id', 'name sale_price images');
  }

  const [data, total] = await Promise.all([
    queryExec.lean(),
    Variant.countDocuments(filter)
  ]);

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    data
  };
};

export default {
  generateVariants,
  updateVariant,
  bulkUpdateVariants,
  deleteVariant,
  deleteAllVariants,
  importVariants,
  exportVariants,
  cleanupExportedFile,
  getVariantById,
  getVariantOptions,
  getAdminVariants
 };
