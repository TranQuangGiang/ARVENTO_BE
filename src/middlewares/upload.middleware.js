import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import sharp from "sharp";

// Lấy đường dẫn thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Định nghĩa thư mục lưu trữ file
const uploadDir = path.join(__dirname, "..", "..", "public", "uploads", "banners");
// Định nghĩa thư mục lưu trữ file post
const postUploadDir = path.join(__dirname, "..", "..", "public", "uploads", "posts");
// Định nghĩa thư mục lưu trữ file product
const productUploadDir = path.join(__dirname, "..", "..", "uploads", "products");

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
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "banner-" + uniqueSuffix + ext);
  },
});
// Cấu hình storage cho post
const postStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, postUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === "thumbnail" ? "thumb-" : "album-";
    cb(null, prefix + uniqueSuffix + ext);
  },
});
// Cấu hình storage cho product
const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, productUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "product-" + uniqueSuffix + ext);
  },
});
// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file hình ảnh (jpeg, jpg, png, gif, webp)"));
  }
};

// Khởi tạo multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: fileFilter,
});
// Khởi tạo multer cho post
const postUpload = multer({
  storage: postStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: fileFilter,
});
// Khởi tạo multer cho product
const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
// Middleware xử lý upload một file
export const uploadBannerImage = (req, res, next) => {
  upload.single("image")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Kích thước file vượt quá giới hạn 5MB",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Lỗi upload: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // Thêm URL cho file đã upload
    if (req.file) {
      // Tạo đường dẫn tương đối cho file
      const relativePath = path.relative(path.join(__dirname, "..", "..", "public"), req.file.path).replace(/\\/g, "/");
      const host = req.protocol + "://" + req.get("host"); // ví dụ http://localhost:3000
      req.file.url = `${host}/${relativePath}`;
    }

    next();
  });
};
// Middleware xử lý upload post images
export const uploadPostImages = (req, res, next) => {
  postUpload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "album", maxCount: 10 },
  ])(req, res, function (err) {
    if (err instanceof multer.MulterError) {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Kích thước file vượt quá giới hạn 5MB",
    });
  }
  return res.status(400).json({
    success: false,
    message: `Lỗi upload: ${err.message}`,
  });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const host = req.protocol + '://' + req.get('host');

    if (req.files) {
      if (req.files.thumbnail) {
        req.files.thumbnail.forEach((file) => {
          const relativePath = path
            .relative(path.join(__dirname, "..", "..", "public"), file.path)
            .replace(/\\/g, "/");
          file.url = `${host}/${relativePath}`;
        });
      }

      if (req.files.album) {
        req.files.album.forEach((file) => {
          const relativePath = path
            .relative(path.join(__dirname, "..", "..", "public"), file.path)
            .replace(/\\/g, "/");
          file.url = `${host}/${relativePath}`;
        });
      }
    }

    next();
  });
};
// Middleware upload ảnh sản phẩm
export const uploadProductImages = (req, res, next) => {
  productUpload.fields([
    { name: "images", maxCount: 10 },
    { name: "variantImages", maxCount: 10 }
  ])(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Kích thước file vượt quá giới hạn 5MB",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Lỗi upload: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next(); // Qua xử lý resize tiếp theo
  });
};

export const processProductImages = async (req, res, next) => {
  try {
    if (!req.files) return next();

    const host = req.protocol + "://" + req.get("host");
    const productUploadDir = path.join(__dirname, "..", "..", "public", "uploads", "products");

    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(productUploadDir)) {
      fs.mkdirSync(productUploadDir, { recursive: true });
    }

    const processImage = async (file, prefix = "product") => {
      const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpeg`;
      const outputPath = path.join(productUploadDir, filename);

      // Resize và lưu file ảnh
      await sharp(file.path)
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .toFormat("jpeg")
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      // Xóa file gốc tạm (nếu được phép)
      try {
        await fs.promises.unlink(file.path);
      } catch (err) {
        if (err.code !== "ENOENT" && err.code !== "EPERM") {
          throw err;
        }
        console.warn(`⚠️ Không thể xoá file tạm: ${file.path} - ${err.message}`);
      }

      return `${host}/uploads/products/${filename}`;
    };

    // Xử lý images chính
    if (req.files.images && Array.isArray(req.files.images)) {
      req.body.images = await Promise.all(
        req.files.images.map(file => processImage(file, "main"))
      );
    }

    // Xử lý variantImages
    if (req.files.variantImages && Array.isArray(req.files.variantImages)) {
      const variantImages = await Promise.all(
        req.files.variantImages.map((file, index) => processImage(file, `variant-${index}`))
      );

      if (req.body.variants) {
        let variants;
        try {
          // Cho phép variants là JSON string hoặc array
          variants = typeof req.body.variants === "string"
            ? JSON.parse(req.body.variants)
            : req.body.variants;

          if (!Array.isArray(variants)) throw new Error();

          // Gán ảnh tương ứng cho từng variant
          req.body.variants = variants.map((variant, idx) => ({
            ...variant,
            image: variantImages[idx] || null,
          }));
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: "Trường `variants` phải là JSON hợp lệ dạng mảng.",
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi xử lý ảnh sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xử lý ảnh sản phẩm.",
    });
  }
};

export default { uploadBannerImage, uploadPostImages , uploadProductImages, processProductImages };
