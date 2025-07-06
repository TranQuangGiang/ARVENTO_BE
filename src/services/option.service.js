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

  // GHI ĐÈ giá trị cũ bằng giá trị mới
  option.values = newValues;

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
