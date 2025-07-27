import mongoose from "mongoose";
import Variant from "./variant.model.js";
import Option from "./option.model.js";
import mongoosePaginate from "mongoose-paginate-v2";
import cartModel from "./cart.model.js";
const productSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    product_code: {
      type: String,
      required: true,
      maxLength: 50,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      maxLength: 150,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      maxLength: 150,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    original_price: {
      type: mongoose.Types.Decimal128,
      required: true,
      min: 0,
    },
    // sale_price: {
    //   type: mongoose.Types.Decimal128,
    //   min: 0,
    //   default: 0,
    //   validate: {
    //     validator: function (value) {
    //       const original = parseFloat(this.original_price?.toString() || "0");
    //       const sale = parseFloat(value?.toString() || "0");
    //       return sale <= original;
    //     },
    //     message: "Giá khuyến mãi không được lớn hơn giá gốc",
    //   },
    // },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    is_manual: {
      type: Boolean,
      default: false, // true: admin điều khiển trạng thái, false: tự động theo tồn kho
    },
    options: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
productSchema.plugin(mongoosePaginate);
// Tính tổng tồn kho và tự động cập nhật trạng thái
productSchema.methods.calculateTotalStock = async function () {
  const variants = await Variant.find({ product_id: this._id });
  const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
  this.stock = totalStock;

  if (!this.is_manual) {
    this.isActive = totalStock > 0;
  }

  await this.save();
  return totalStock;
};
productSchema.methods.validatePrice = function () {
  const original = parseFloat(this.original_price?.toString() || "0");
  const sale = parseFloat(this.sale_price?.toString() || "0");
  if (sale > original) {
    console.log("→ So sánh giá: sale =", sale, "original =", original);
    throw new Error("Giá khuyến mãi không được lớn hơn giá gốc");
  }
};

// Hook pre-save để kiểm tra giá
productSchema.pre("save", function (next) {
  try {
    this.validatePrice();
    next();
  } catch (error) {
    next(error);
  }
});
// Khi Product bị xóa, tự xóa các item trong giỏ hàng
productSchema.pre("remove", async function (next) {
  await cartModel.updateMany({}, { $pull: { items: { product: this._id } } });
  next();
});
productSchema.pre("save", async function (next) {
  const allOptions = await Option.find({});
  const validKeys = allOptions.map((opt) => opt.key);

  for (const [key, values] of this.options.entries()) {
    if (!validKeys.includes(key)) {
      return next(new Error(`Invalid option key: ${key}`));
    }

    const option = allOptions.find((opt) => opt.key === key);

    const valuesArray = Array.isArray(values) ? values : [values];

    let allValid = true;

    if (key === "color") {
      allValid = valuesArray.every((val) => {
        const colorName = typeof val === "object" && val !== null ? val.name?.toLowerCase() : val?.toLowerCase();
        return option.values.some((c) => c.name.toLowerCase() === colorName);
      });
    } else {
      allValid = valuesArray.every((val) => option.values.includes(val));
    }

    if (!allValid) {
      return next(new Error(`Invalid value(s) '${valuesArray}' for option '${key}'`));
    }
  }

  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
