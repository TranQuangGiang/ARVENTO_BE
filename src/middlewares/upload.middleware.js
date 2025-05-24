import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name using ES module approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directory - this will be relative to the project root
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create a subdirectory for the current date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    const dateDir = path.join(uploadDir, today);
    
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }
    
    cb(null, dateDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename: original name + timestamp + extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter function to validate file types
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
  
  // Check the file extension
  const extname = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  
  // Check the MIME type
  const mimetype = allowedFileTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    // Accept the file
    cb(null, true);
  } else {
    // Reject the file
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'), false);
  }
};

// Create the multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size exceeds the 5MB limit'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
        // An unknown error occurred
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      // If file was uploaded successfully, add the file URL to the request
      if (req.file) {
        // Get the relative path from the upload directory
        const relativePath = path.relative(
          path.join(__dirname, '..', '..', 'public'),
          req.file.path
        ).replace(/\\/g, '/'); // Replace backslashes with forward slashes for URLs
        
        // Create the URL for the uploaded file
        req.file.url = `/${relativePath}`;
      }
      
      next();
    });
  };
};

// Middleware for multiple files upload
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'One or more files exceed the 5MB limit'
          });
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Too many files. Maximum allowed: ${maxCount}`
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
        // An unknown error occurred
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      // If files were uploaded successfully, add URLs to each file
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          // Get the relative path from the upload directory
          const relativePath = path.relative(
            path.join(__dirname, '..', '..', 'public'),
            file.path
          ).replace(/\\/g, '/'); // Replace backslashes with forward slashes for URLs
          
          // Create the URL for the uploaded file
          file.url = `/${relativePath}`;
        });
      }
      
      next();
    });
  };
};

export default {
  uploadSingle,
  uploadMultiple
};
