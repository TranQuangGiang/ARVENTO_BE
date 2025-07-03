import * as normalizeUtil from '../utils/normalize.util.js';
import responseUtil from '../utils/response.util.js';
import {
  createOptionSchema,
  updateOptionSchema
} from '../validations/option.validation.js';
import optionService from '../services/option.service.js';
import { checkDuplicateValues,normalizeOptionValues } from '../utils/normalize.util.js';
import parseQueryParams from '../utils/queryParser.util.js';
const createMultipleOptions = async (req, res) => {
  try {
    const options = req.body;

    if (!Array.isArray(options)) {
      return responseUtil.badRequestResponse(res, null, 'Request body must be an array.');
    }

    const created = [];

    for (const item of options) {
      const { error, value } = createOptionSchema.validate(item, { abortEarly: false });
      if (error) {
        return responseUtil.validationErrorResponse(res, error.details.map(d => d.message));
      }

      // Check trùng key
      const existing = await optionService.findOption({ key: req.params.key });
      if (existing) {
        return responseUtil.conflictResponse(res, null, `Option key "${value.key}" already exists.`);
      }

      // Chuẩn hóa values
      const normalizedValues = normalizeOptionValues(value.key, value.values);

      // Check trùng value
      const duplicateVal = checkDuplicateValues(normalizedValues, value.key);
      if (duplicateVal) {
        return responseUtil.validationErrorResponse(res, [`Duplicate value "${duplicateVal}" in option values.`]);
      }

      const option = await optionService.createOption({
        key: value.key,
        values: normalizedValues
      });

      created.push(option);
    }

    return responseUtil.createdResponse(res, created, 'Options created successfully.');
  } catch (err) {
    return responseUtil.errorResponse(res, null, err.message);
  }
};

const getAllOptions = async (req, res) => {
    try {
        const { filters, sort, page, limit } = parseQueryParams(req.query, {
            key: 'string'
        });

        const result = await optionService.getAllOptions(filters, sort, page, limit);
        return responseUtil.successResponse(res, result, 'Options fetched successfully.');
    } catch (err) {
        return responseUtil.errorResponse(res, null, err.message);
    }
};

const getOptionByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, name, hex } = req.query;

    const filters = { key };

    // Trường hợp size (mảng string)
    if (key === 'size' && value) {
      filters.values = value;
    }

    // Trường hợp color (mảng object)
    if (key === 'color') {
      if (name) filters['values.name'] = name;
      if (hex) filters['values.hex'] = hex;
    }

    const option = await optionService.findOption(filters);

    if (!option) {
      return responseUtil.notFoundResponse(res, null, 'Option not found.');
    }

    return responseUtil.successResponse(res, option, 'Option fetched successfully.');
  } catch (err) {
    return responseUtil.errorResponse(res, null, err.message);
  }
};

const updateOptionByKey = async (req, res) => {
  try {
    const key = req.params.key;

    const { error, value } = updateOptionSchema.validate(
      req.body,
      {
        abortEarly: false,
        context: { key }
      }
    );

    if (error) {
      return responseUtil.validationErrorResponse(
        res,
        error.details.map(d => d.message)
      );
    }

    let normalizedValues = normalizeUtil.normalizeOptionValues(key, value.values);

    if (!Array.isArray(normalizedValues) || normalizedValues.length === 0) {
      return responseUtil.badRequestResponse(
        res,
        null,
        `Values cannot be empty for option "${key}".`
      );
    }

    // Không cần check duplicate nữa vì merge bên service

    const updated = await optionService.updateOptionByKey(key, normalizedValues);
    if (!updated) {
      return responseUtil.notFoundResponse(res, null, 'Option not found.');
    }

    return responseUtil.successResponse(
      res,
      updated,
      'Option updated successfully.'
    );
  } catch (err) {
    return responseUtil.errorResponse(res, null, err.message);
  }
};



const deleteOptionByKey = async (req, res) => {
    try {
        const deleted = await optionService.deleteOptionByKey(req.params.key);
        if (!deleted) {
            return responseUtil.notFoundResponse(res, null, 'Option not found.');
        }
        return responseUtil.successResponse(res, deleted, 'Option deleted successfully.');
    } catch (err) {
        return responseUtil.errorResponse(res, null, err.message);
    }
};

export default {
    createMultipleOptions,
    getAllOptions,
    getOptionByKey,
    updateOptionByKey,
    deleteOptionByKey,
};
