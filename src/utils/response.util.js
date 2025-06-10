
// 200 OK
const successResponse = (res, data = null, message = "Success", code = 200) => {
  return res.status(code).json({
    success: true,
    message,
    data,
  });
};

// 201 Created
const createdResponse = (res, data = null, message = "Created successfully") => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

// 204 No Content
const noContentResponse = (res, data = null, message = "No content") => {
  return res.status(204).json({
    success: true,
    message,
    data,
  });
};

// 400 Bad Request
const badRequestResponse = (res, data = null, message = "Bad request") => {
  return res.status(400).json({
    success: false,
    message,
    data,
  });
};

// 401 Unauthorized
const unauthorizedResponse = (res, data = null, message = "Unauthorized") => {
  return res.status(401).json({
    success: false,
    message,
    data,
  });
};

// 403 Forbidden
const forbiddenResponse = (res, data = null, message = "Forbidden") => {
  return res.status(403).json({
    success: false,
    message,
    data,
  });
};

// 404 Not Found
const notFoundResponse = (res, data = null, message = "Not found") => {
  return res.status(404).json({
    success: false,
    message,
    data,
  });
};

// 409 Conflict
const conflictResponse = (res, data = null, message = "Conflict") => {
  return res.status(409).json({
    success: false,
    message,
    data,
  });
};

// 422 Unprocessable Entity (Validation error)
const validationErrorResponse = (res, data = null, message = "Validation failed") => {
  return res.status(422).json({
    success: false,
    message,
    data,
  });
};

// 500 Internal Server Error
const errorResponse = (res, data = null, message = "Internal server error", code = 500) => {
  return res.status(code).json({
    success: false,
    message,
    data,
  });
};
// Hàm tạo mã ngẫu nhiên
export const generateRandomCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

export default {
  successResponse,
  createdResponse,
  noContentResponse,
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
  conflictResponse,
  validationErrorResponse,
  errorResponse,
  generateRandomCode,
};
