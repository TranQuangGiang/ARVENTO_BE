// Banner validation utilities

/**
 * Validate banner data fields
 * @param {Object} data - Banner data to validate
 * @returns {Array} Array of validation errors
 */
export const validateBannerData = (data) => {
  const errors = [];
  
  if (data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Tiêu đề là bắt buộc và phải là chuỗi ký tự');
    } else if (data.title.trim().length < 3) {
      errors.push('Tiêu đề phải có ít nhất 3 ký tự');
    } else if (data.title.trim().length > 255) {
      errors.push('Tiêu đề không được vượt quá 255 ký tự');
    }
  }
  
  if (data.link !== undefined && data.link !== null && data.link !== '') {
    if (typeof data.link === 'string') {
      // eslint-disable-next-line no-useless-escape
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(data.link.trim())) {
        errors.push('Đường dẫn phải là URL hợp lệ');
      }
    }
  }
  
  if (data.position !== undefined) {
    const position = parseInt(data.position);
    if (isNaN(position) || position < 0) {
      errors.push('Vị trí phải là số không âm');
    } else if (position > 999) {
      errors.push('Vị trí không được vượt quá 999');
    }
  }
  
  return errors;
};

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateId = (id) => {
  if (!id) {
    return 'ID là bắt buộc';
  }
  
  // Check if it's a valid MongoDB ObjectId (24 hex characters)
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return 'Định dạng ID không hợp lệ';
  }
  
  return null;
};

/**
 * Validate required title field
 * @param {string} title - Title to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateRequiredTitle = (title) => {
  if (!title || title.trim().length === 0) {
    return 'Tiêu đề là bắt buộc';
  }
  return null;
};

/**
 * Validate image file upload
 * @param {Object} file - Uploaded file object
 * @returns {string|null} Error message or null if valid
 */
export const validateImageFile = (file) => {
  if (!file) {
    return 'Hình ảnh là bắt buộc';
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    return 'Chỉ cho phép file hình ảnh (JPEG, PNG, GIF, WebP)';
  }
  
  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return 'Kích thước hình ảnh không được vượt quá 5MB';
  }
  
  return null;
};

/**
 * Validate image file upload for update (optional)
 * @param {Object} file - Uploaded file object
 * @returns {string|null} Error message or null if valid
 */
export const validateOptionalImageFile = (file) => {
  if (!file) {
    return null; // File is optional for update
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    return 'Chỉ cho phép file hình ảnh (JPEG, PNG, GIF, WebP)';
  }
  
  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return 'Kích thước hình ảnh không được vượt quá 5MB';
  }
  
  return null;
};

/**
 * Validate banner status (is_active)
 * @param {any} is_active - Status value to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateBannerStatus = (is_active) => {
  if (is_active === undefined || is_active === null) {
    return 'Trạng thái banner (is_active) là bắt buộc';
  }
  
  if (typeof is_active !== 'boolean' && is_active !== 'true' && is_active !== 'false') {
    return 'Trạng thái banner phải là true hoặc false';
  }
  
  return null;
};

/**
 * Validate banner position
 * @param {any} position - Position value to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateBannerPosition = (position) => {
  if (position === undefined || position === null) {
    return 'Vị trí banner là bắt buộc';
  }
  
  const positionValue = parseInt(position);
  
  if (isNaN(positionValue) || positionValue < 0) {
    return 'Vị trí phải là số không âm';
  }
  
  if (positionValue > 999) {
    return 'Vị trí không được vượt quá 999';
  }
  
  return null;
};

/**
 * Validate if at least one field is provided for update
 * @param {Object} data - Update data object
 * @param {Object} file - Uploaded file object
 * @returns {string|null} Error message or null if valid
 */
export const validateUpdateFields = (data, file) => {
  const { title, link, is_active, position } = data;
  
  if (!title && !link && is_active === undefined && position === undefined && !file) {
    return 'Ít nhất một trường dữ liệu phải được cung cấp để cập nhật';
  }
  
  return null;
};

/**
 * Validate title for update (cannot be empty if provided)
 * @param {string} title - Title to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateUpdateTitle = (title) => {
  if (title !== undefined && (!title || title.trim().length === 0)) {
    return 'Tiêu đề không được để trống';
  }
  return null;
};