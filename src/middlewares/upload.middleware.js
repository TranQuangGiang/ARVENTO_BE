import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Lấy đường dẫn thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Định nghĩa thư mục lưu trữ file
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'banners');
// Định nghĩa thư mục lưu trữ file post
const postUploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'posts');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(postUploadDir)) {
  fs.mkdirSync(postUploadDir, { recursive: true });
}
// Cấu hình storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'banner-' + uniqueSuffix + ext);
  }
});
// Cấu hình storage cho post
const postStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, postUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'thumbnail' ? 'thumb-' : 'album-';
    cb(null, prefix + uniqueSuffix + ext);
  }
});
// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file hình ảnh (jpeg, jpg, png, gif, webp)'));
  }
};

// Khởi tạo multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: fileFilter
});
// Khởi tạo multer cho post
const postUpload = multer({
  storage: postStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: fileFilter
});


// Middleware xử lý upload một file
export const uploadBannerImage = (req, res, next) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Kích thước file vượt quá giới hạn 5MB'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Lỗi upload: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Thêm URL cho file đã upload
    if (req.file) {
      // Tạo đường dẫn tương đối cho file
      const relativePath = path.relative(
        path.join(__dirname, '..', '..', 'public'),
        req.file.path
      ).replace(/\\/g, '/');
      const host = req.protocol + '://' + req.get('host'); // ví dụ http://localhost:3000
req.file.url = `${host}/${relativePath}`;
    }
    
    next();
  });
};
// Middleware xử lý upload post images
export const uploadPostImages = (req, res, next) => {
  postUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'album', maxCount: 10 }
  ])(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Kích thước file vượt quá giới hạn 5MB'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Lỗi upload: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Thêm URL cho các file đã upload
    if (req.files) {
      if (req.files.thumbnail) {
        req.files.thumbnail.forEach(file => {
          const relativePath = path.relative(
            path.join(__dirname, '..', '..', 'public'),
            file.path
          ).replace(/\\/g, '/');
          const host = req.protocol + '://' + req.get('host');
file.url = `${host}/${relativePath}`;
        });
      }
      
      if (req.files.album) {
        req.files.album.forEach(file => {
          const relativePath = path.relative(
            path.join(__dirname, '..', '..', 'public'),
            file.path
          ).replace(/\\/g, '/');
         const host = req.protocol + '://' + req.get('host');
file.url = `${host}/${relativePath}`;
        });
      }
    }
    
    next();
  });
};
export default { uploadBannerImage, uploadPostImages };
