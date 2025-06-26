import multer from "multer";
import path from "path";
import fs from "graceful-fs"; // chống lỗi EPERM
import sharp from "sharp";
import { fileURLToPath } from "url";

// Xác định __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Định nghĩa thư mục đích
const bannerDir = path.join(__dirname, "..", "..", "public", "uploads", "banners");
const postDir = path.join(__dirname, "..", "..", "public", "uploads", "posts");
const productDir = path.join(__dirname, "..", "..", "public", "uploads", "products");
const importDir = path.join(__dirname, "..", "..", "public", "uploads", "imports");
const reviewDir = path.join(__dirname, "..", "..", "public", "uploads", "reviews");
// Đảm bảo thư mục tồn tại
[bannerDir, postDir, productDir , importDir, reviewDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error("Chỉ chấp nhận file hình ảnh (jpeg, jpg, png, gif, webp)"));
};

// ======== 1. Multer cấu hình ========

const bannerUpload = multer({
  storage: multer.diskStorage({
    destination: bannerDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `banner-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

const postUpload = multer({
  storage: multer.diskStorage({
    destination: postDir,
    filename: (req, file, cb) => {
      const prefix = file.fieldname === "thumbnail" ? "thumb" : "album";
      const ext = path.extname(file.originalname);
      cb(null, `${prefix}-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

// ✅ Dùng bộ nhớ thay vì tạo file tạm
const productUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

// ======== 2. Middleware upload ========

export const uploadBannerImage = (req, res, next) => {
  bannerUpload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (req.file) {
      const relative = path.relative(path.join(__dirname, "..", "..", "public"), req.file.path).replace(/\\/g, "/");
      const host = `${req.protocol}://${req.get("host")}`;
      req.file.url = `${host}/${relative}`;
    }
    next();
  });
};

export const uploadPostImages = (req, res, next) => {
  postUpload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "album", maxCount: 10 }
  ])(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    const host = `${req.protocol}://${req.get("host")}`;
    if (req.files?.thumbnail) {
      req.files.thumbnail.forEach(file => {
        const rel = path.relative(path.join(__dirname, "..", "..", "public"), file.path).replace(/\\/g, "/");
        file.url = `${host}/${rel}`;
      });
    }
    if (req.files?.album) {
      req.files.album.forEach(file => {
        const rel = path.relative(path.join(__dirname, "..", "..", "public"), file.path).replace(/\\/g, "/");
        file.url = `${host}/${rel}`;
      });
    }
    next();
  });
};

export const uploadProductImages = productUpload.fields([
  { name: "images", maxCount: 10 },
  { name: "image", maxCount: 10 },
  ...Array.from({ length: 9 }).map((_, i) => ({
    name: `variants[${i}][image]`,
    maxCount: 1
  }))
]);

// ======== 3. Middleware xử lý ảnh sản phẩm ========

export const processProductImages = async (req, res, next) => {
  try {
    if (!req.files) return next();
    const host = `${req.protocol}://${req.get("host")}`;

    const processImageBuffer = async (file, prefix) => {
      const ext = path.extname(file.originalname) || ".jpg";
      const filename = `${prefix}-${Date.now()}${ext}`;
      const fullPath = path.join(productDir, filename);

      await sharp(file.buffer)
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .toFormat(ext.replace(".", ""), { quality: 80 })
        .toFile(fullPath);

      return {
        url: `${host}/uploads/products/${filename}`,
        alt: file.originalname.split(".")[0] || prefix
      };
    };

    // Xử lý ảnh chính
    if (req.files.images) {
      req.body.images = await Promise.all(
        req.files.images.map((file, index) => processImageBuffer(file, `product-${index}`))
      );
    }

    // Xử lý ảnh nếu tên là "image" (không phải "images")
    if (req.files.image && !req.body.images) {
      req.body.images = await Promise.all(
        req.files.image.map((file, index) => processImageBuffer(file, `product-${index}`))
      );
    }

    // Xử lý ảnh variants
    req.body.variants = [];
    for (const [fieldName, files] of Object.entries(req.files)) {
      const match = fieldName.match(/variants\[(\d+)\]\[image\]/);
      if (match && files?.[0]) {
        const index = parseInt(match[1]);
        const img = await processImageBuffer(files[0], `variant-${index}`);
        req.body.variants[index] = {
          size: req.body[`variants[${index}][size]`],
          color: req.body[`variants[${index}][color]`],
          stock: parseInt(req.body[`variants[${index}][stock]`] || 0),
          image: img
        };
      }
    }
    req.body.variants = req.body.variants.filter(Boolean);
    next();
  } catch (err) {
    console.error("❌ Lỗi xử lý ảnh:", err);
    res.status(500).json({ success: false, message: "Lỗi xử lý ảnh sản phẩm" });
  }
};
// ======== 4. Middleware upload file import (Excel/CSV) ========
export const uploadImportFile = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "..", "..", "public", "uploads", "imports"),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `import-${Date.now()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file Excel (.xlsx) hoặc CSV"));
    }
  }
}).single("file");
export const handleUploadImportFile = (req, res, next) => {
  uploadImportFile(req, res, (err) => {
     console.log("📥 Multer executed. req.file =", req.file);
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};
const reviewUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isValid = allowedTypes.test(file.mimetype);
    cb(isValid ? null : new Error("Chỉ cho phép hình ảnh"), isValid);
  }
}).array("images", 5);
export const handleReviewUpload = (req, res, next) => {
  reviewUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    const host = `${req.protocol}://${req.get("host")}`;
    if (req.files?.length) {
      req.body.images = await Promise.all(
        req.files.map(async (file, index) => {
          const ext = path.extname(file.originalname) || ".jpg";
          const filename = `review-${Date.now()}-${index}${ext}`;
          const fullPath = path.join(reviewDir, filename);
          await sharp(file.buffer)
            .resize(800, 800, { fit: "inside", withoutEnlargement: true })
            .toFormat(ext.replace(".", ""), { quality: 80 })
            .toFile(fullPath);
          return `${host}/uploads/reviews/${filename}`;
        })
      );
    }
    next();
  });
};
export default {
  uploadBannerImage,
  uploadPostImages,
  uploadProductImages,
  processProductImages,
  uploadImportFile,
  handleUploadImportFile,
  handleReviewUpload,
};
