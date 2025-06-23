// File: controllers/variant.controller.js
// import variantService from '../services/variant.service.js';
import variantService from '../services/variant.services.js';
import responseUtil from '../utils/response.util.js';
import Product from '../models/product.model.js';
import Variant from '../models/variant.model.js';

const generateVariants = async (req, res) => {
  try {
    const { options, overwrite } = req.body;
    const data = await variantService.generateVariants(
      req.params.productId,
      { options, overwrite }
    );
    return responseUtil.successResponse(res, data, 'Sinh biến thể thành công');
  } catch (err) {
    return responseUtil.errorResponse(res, null, err.message || 'Đã xảy ra lỗi');
  }
};



const updateVariant = async (req, res) => {
  try {
    const variantId = req.params.id;
    const productId = req.params.productId;
    const update = { ...req.body };
if ('size' in update || 'color' in update) {
      return responseUtil.errorResponse(
        res,
        null,
        'Không được phép thay đổi size hoặc color của biến thể'
      );
    }
    if (update.stock) update.stock = parseInt(update.stock);
    if (update.price) update.price = parseFloat(update.price);

    // Parse color nếu là chuỗi JSON
    if (update.color && typeof update.color === 'string') {
      try {
        update.color = JSON.parse(update.color);
      } catch (err) {
        return responseUtil.errorResponse(res, null, 'Color phải là JSON hợp lệ');
      }
    }

    // Lấy product để kiểm tra sale_price & imageIndex
    const product = await Product.findById(productId).lean();
    if (!product) {
      return responseUtil.errorResponse(res, null, 'Sản phẩm không tồn tại');
    }
    //  Kiểm tra trùng size + color trước khi cập nhật
    if (update.size || update.color) {
      const sizeToCheck = update.size;
      const colorNameToCheck = update.color?.name;

      if (sizeToCheck && colorNameToCheck) {
        const exists = await Variant.findOne({
          _id: { $ne: variantId },
          product_id: productId,
          size: sizeToCheck,
          'color.name': colorNameToCheck
        });

        if (exists) {
          return responseUtil.errorResponse(
            res,
            null,
            `Biến thể với size "${sizeToCheck}" và màu "${colorNameToCheck}" đã tồn tại`
          );
        }
      }
    }


    // Kiểm tra giá: variant.price <= product.sale_price
    if (
      update.price !== undefined &&
      product.sale_price !== undefined &&
      Number(update.price) > Number(product.sale_price)
    ) {
      return responseUtil.errorResponse(
        res,
        null,
        'Giá biến thể không được lớn hơn giá khuyến mãi của sản phẩm'
      );
    }

    const imageIndex = parseInt(req.body.imageIndex);
    if (!isNaN(imageIndex)) {
      const variant = await Variant.findById(variantId).lean();
      if (!variant) {
        return responseUtil.errorResponse(res, null, 'Không tìm thấy biến thể');
      }

      // Nếu imageIndex khác thì mới thay ảnh
      const oldImageUrl = variant.image?.url;
      const newImageFromProduct = product?.images?.[imageIndex];

      if (!newImageFromProduct || !newImageFromProduct.url) {
        return responseUtil.errorResponse(res, null, 'Ảnh sản phẩm không tồn tại tại vị trí đã chọn');
      }

      if (oldImageUrl !== newImageFromProduct.url) {
        update.image = {
          url: newImageFromProduct.url,
          alt: newImageFromProduct.alt || `Ảnh ${imageIndex}`
        };
      }
    }
    if ((!req.body.sku || req.body.sku.trim() === '') && update.size && update.color?.name) {
      const cleanColor = update.color.name.replace(/[^a-zA-Z0-9]/g, '');
      update.sku = `VAR-${update.size}-${cleanColor}-${Date.now()}`;
    }


    const result = await variantService.updateVariant(productId, variantId, update);
    return responseUtil.successResponse(res, result, 'Cập nhật biến thể thành công');
  } catch (err) {
    return responseUtil.errorResponse(res, null, err.message);
  }
};




const bulkUpdateVariants = async (req, res) => {
  try {
    const data = await variantService.bulkUpdateVariants(req.params.productId, req.body.updates);
    return responseUtil.successResponse(res, data, 'Cập nhật hàng loạt thành công');
  } catch (err) {
    return responseUtil.errorResponse(res, null, err.message);
  }
};
const deleteVariant = async (req, res) => {
  try {
    const { productId, id } = req.params;

    // Gọi service để xử lý logic xoá
    await variantService.deleteVariant(productId, id);

    return responseUtil.successResponse(res, null, 'Xoá biến thể thành công');
  } catch (err) {
    console.error('Lỗi khi xoá biến thể:', err); // 🪵 Log giúp debug
    return responseUtil.errorResponse(res, null, err.message || 'Đã xảy ra lỗi');
  }
};


const deleteAllVariants = async (req, res) => {
  try {
    await variantService.deleteAllVariants(req.params.productId);
    return responseUtil.successResponse(res, null, 'Đã xoá toàn bộ biến thể');
  } catch (err) {
    return responseUtil.errorResponse(res, null, err.message);
  }
};

const importVariants = async (req, res) => {
  try {
    const variantImages = req.variantImages || {}; // ✅ từ middleware
    const data = await variantService.importVariants(req.params.productId, req.file?.path, variantImages);
    return responseUtil.successResponse(res, data, 'Import biến thể thành công');
  } catch (err) {
    return responseUtil.errorResponse(res, null, err.message);
  }
};

const exportVariants = async (req, res) => {
  try {
    const filePath = await variantService.exportVariants(req.params.productId);
    return res.download(filePath, err => {
      if (!err) variantService.cleanupExportedFile(filePath);
    });
  } catch (err) {
    return responseUtil.errorResponse(res, null, err.message);
  }
};

const getAdminVariants = async (req, res) => {
  try {
    const data = await variantService.getAdminVariants(req.params.productId, req.query);
    return responseUtil.successResponse(res, data);
  } catch (err) {
    return responseUtil.errorResponse(res, null, err.message);
  }
};

const getVariantById = async (req, res) => {
  try {
    const data = await variantService.getVariantById(req.params.productId, req.params.id);
    return responseUtil.successResponse(res, data, 'Lấy biến thể thành công');
  } catch (err) {
    return responseUtil.notFoundResponse(res, null, err.message);
  }
};
const getVariantOptions = async (req, res) => {
  try {
    const data = await variantService.getVariantOptions(req.params.productId);
    return responseUtil.successResponse(res, data, 'Lấy tùy chọn thành công');
  } catch (err) {
    return responseUtil.errorResponse(res, null, err.message);
  }
};

const VariantController = {
  generateVariants,
  updateVariant,
  bulkUpdateVariants,
  deleteVariant,
  deleteAllVariants,
  importVariants,
  exportVariants,
  getAdminVariants,
  getVariantById,
  getVariantOptions
};

export default VariantController;
