import { StatusCodes } from 'http-status-codes';
import responseUtil from '../utils/response.util.js';

/**
 * Middleware validate riêng body, params, query
 * @param {Object} schemas - object chứa schema cho từng phần
 * {
 *   body: JoiSchema,
 *   params: JoiSchema,
 *   query: JoiSchema
 * }
 */
const validate = (schemas) => (req, res, next) => {
  try {
    // Validate params nếu có schema
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        const errors = error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message.replace(/['"]/g, ''),
          type: d.type,
        }));
        return responseUtil.validationErrorResponse(
          res,
          { errors },
          'Dữ liệu params không hợp lệ',
          StatusCodes.BAD_REQUEST
        );
      }
      req.params = value;
    }

    // Validate query nếu có schema
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        const errors = error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message.replace(/['"]/g, ''),
          type: d.type,
        }));
        return responseUtil.validationErrorResponse(
          res,
          { errors },
          'Dữ liệu query không hợp lệ',
          StatusCodes.BAD_REQUEST
        );
      }
      req.query = value;
    }

    // Validate body nếu có schema
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        const errors = error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message.replace(/['"]/g, ''),
          type: d.type,
        }));
        return responseUtil.validationErrorResponse(
          res,
          { errors },
          'Dữ liệu body không hợp lệ',
          StatusCodes.BAD_REQUEST
        );
      }
      req.body = value;
    }

    // Nếu tất cả đều hợp lệ thì next
    next();
  } catch (err) {
    // Nếu có lỗi bất ngờ, trả lỗi 500
    return responseUtil.errorResponse(
      res,
      null,
      'Lỗi máy chủ khi validate dữ liệu',
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export { validate };
