import mongoose from 'mongoose';
import baseResponse from '../utils/baseResponse.js';
import {logger} from '../config/index.js'

const errorHandler = (err, req, res) => {
  logger.error(`[ERROR] ${err.name}: ${err.message}`);

  // Invalid ObjectId (from Mongoose)
  if (err instanceof mongoose.Error.CastError && err.kind === 'ObjectId') {
    return baseResponse.badRequestResponse(res, null, 'Invalid ID format');
  }

  // Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map(e => e.message);
    return baseResponse.validationErrorResponse(res, errors, 'Validation error');
  }

  // Duplicate key error (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    return baseResponse.conflictResponse(res, null, `Duplicate field: ${field}`);
  }

  // Custom application errors (có statusCode và message)
  if (err.statusCode && err.message) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Fallback error: Internal Server Error
  return baseResponse.errorResponse(res, null, 'Internal Server Error');
};

export default errorHandler;
