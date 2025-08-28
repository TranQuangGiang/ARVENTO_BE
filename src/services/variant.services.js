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

  // ✅ Base price
  const basePrice = parseFloat(product.original_price?.toString() || '0');

  // ✅ Lấy options gốc từ product
  const validSizes = product.options?.get('size') || [];
  const validColorsRaw = product.options?.get('color') || [];

  const validColors = validColorsRaw
    .filter(c => c && typeof c.name === 'string')
    .map(c => c.name.toLowerCase());

  // ==============================
  // 🚀 Chuẩn hóa input
  // ==============================

  // Check size
  const rawInputSizes = inputOptions.size || [];
  if (rawInputSizes.some(s => !s || !s.trim())) {
    throw new Error(`Giá trị size không hợp lệ: trống hoặc rỗng`);
  }
  const inputSizes = rawInputSizes.map(s => s.trim().toUpperCase());
  const duplicateSizes = inputSizes.filter((s, i, arr) => arr.indexOf(s) !== i);
  if (duplicateSizes.length > 0) {
    throw new Error(`Size bị trùng lặp: ${[...new Set(duplicateSizes)].join(', ')}`);
  }

  // Check color
  const rawInputColors = inputOptions.color || [];
  if (rawInputColors.some(c => !c || typeof c !== 'object' || !c.name?.trim())) {
    throw new Error(`Color không hợp lệ: có giá trị rỗng hoặc thiếu name`);
  }
  const inputColors = rawInputColors.map(c => c.name.toLowerCase());
  const duplicateColors = inputColors.filter((c, i, arr) => arr.indexOf(c) !== i);
  if (duplicateColors.length > 0) {
    throw new Error(`Color bị trùng lặp: ${[...new Set(duplicateColors)].join(', ')}`);
  }

  // Validate size
  const invalidSizes = inputSizes.filter(s => !validSizes.includes(s));
  if (invalidSizes.length > 0) {
    throw new Error(`Options không hợp lệ: Size: ${invalidSizes.join(', ')}`);
  }

  // Validate color
  const invalidColors = inputColors.filter(c => !validColors.includes(c));
  if (invalidColors.length > 0) {
    throw new Error(`Options không hợp lệ: Color: ${invalidColors.join(', ')}`);
  }

  // ==============================
  // 🚀 Xóa cũ nếu overwrite
  // ==============================
  if (overwrite) {
    await Variant.deleteMany({ product_id: productId });
  }

  const existingVariants = overwrite ? [] : await Variant.find({ product_id: productId });

  const existingKeys = new Set(
    existingVariants.map(v => {
      const sizeKey = v.size?.toLowerCase() || '';
      const colorKey = typeof v.color === 'object' ? v.color.name.toLowerCase() : '';
      return `${colorKey}-${sizeKey}`;
    })
  );

  // ==============================
  // 🚀 Sinh combinations (COLOR → SIZE)
  // ==============================
  const colorMap = new Map(validColorsRaw.map(c => [c.name.toLowerCase(), c]));
const sortedColors = inputColors
  .map(name => colorMap.get(name))  // đảm bảo theo thứ tự input
  .filter(Boolean);
  const sortedSizes = [...new Set(inputSizes)].sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  const combinations = [];
  for (const color of sortedColors) {
    for (const size of sortedSizes) {
      const key = `${color.name.toLowerCase()}-${size.toLowerCase()}`;
      if (!existingKeys.has(key)) {
        combinations.push({ color, size });
      }
    }
  }

  if (combinations.length === 0) return [];

  // ==============================
  // 🚀 Tạo variant với ảnh map theo color
  // ==============================
  const variants = combinations.map(({ color, size }) => {
    // fix: chuẩn hóa key ảnh theo lowercase để không bị lệch
    const imgKey = color.name.toLowerCase();
    const img = images[imgKey] || {
      url: '',
      alt: `${color.name} ${size || ''}`.trim()
    };

    return {
      product_id: productId,
      size,
      color: {
        name: color.name,
        hex: color.hex || '#CCCCCC'
      },
      sku: `VAR-${size || 'N'}-${color.name || 'N'}-${Date.now()}`,
      stock: 0,
      price: basePrice,
      sale_price: null,
      image: img
    };
  });

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
    colorName
  } = query;

  const skip = (Number(page) - 1) * Number(limit);

  let objectIdProductId;
  try {
    objectIdProductId = new mongoose.Types.ObjectId(productId);
  } catch (err) {
    throw new Error('productId không hợp lệ');
  }

  const match = { product_id: objectIdProductId };

  if (size) {
    match.size = size;
  }

  if (colorName) {
    match['color.name'] = { $regex: new RegExp(colorName, 'i') };
  }

  console.log('>>> MATCH:', match);

  const pipeline = [
    { $match: match },
    {
      $sort: {
        'color.name': 1,
        size: 1
      }
    },
    { $skip: skip },
    { $limit: Number(limit) }
  ];

  const [data, totalCount] = await Promise.all([
    Variant.aggregate(pipeline),
    Variant.countDocuments(match)
  ]);

  return {
    total: totalCount,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit)),
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
