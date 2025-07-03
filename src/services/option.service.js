import Option from '../models/option.model.js';
import { normalizeOptionValues, checkDuplicateValues } from '../utils/normalize.util.js';
const createOption = async (data) => {
  return await Option.create(data);
};

const getAllOptions = async (filters, sort, page, limit) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Option.find(filters).sort(sort).skip(skip).limit(limit),
    Option.countDocuments(filters)
  ]);
  return {
    data,
    pagination: {
      total,
      page,
      limit
    }
  };
};

const findOption = async (filters) => {
  return await Option.findOne(filters);
};

const updateOptionByKey = async (key, newValues) => {
  const option = await Option.findOne({ key });
  if (!option) return null;

  // Giá trị hiện có
  let existingValues = option.values;

  // Gộp lại
  let mergedValues;

  if (key === 'color') {
    const combined = [...existingValues, ...newValues];

    // Loại trùng theo name (không phân biệt hoa thường)
    const seen = new Set();
    mergedValues = [];

    for (const item of combined) {
      const nameLower = item.name.toLowerCase().trim();
      if (!seen.has(nameLower)) {
        mergedValues.push(item);
        seen.add(nameLower);
      }
    }
  } else {
    const combined = [...existingValues, ...newValues];
    mergedValues = Array.from(
      new Set(combined.map(v => v.toUpperCase().trim()))
    );
  }

  option.values = mergedValues;
  await option.save();

  return option;
};

const deleteOptionByKey = async (key) => {
  return await Option.findOneAndDelete({ key });
};

export default {
  createOption,
  getAllOptions,
  findOption,
  updateOptionByKey,
  deleteOptionByKey,
};
