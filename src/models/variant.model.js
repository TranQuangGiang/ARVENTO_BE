import mongoose from "mongoose";
import Product from "./product.model.js";
import Cart from "./cart.model.js";
const variantSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "product_id là bắt buộc"],
      index: true, // Tối ưu truy vấn
    },
    size: {
      type: String,
      maxLength: [10, "Kích thước không vượt quá 10 ký tự"],
      trim: true,
    },
    color: {
      name: { type: String, required: true },
      hex: { type: String, match: /^#([0-9A-F]{3}){1,2}$/i },
    },
    stock: {
      type: Number,
      required: [true, "Số lượng tồn kho là bắt buộc"],
      min: [0, "Số lượng không được âm"],
      default: 0,
    },
    sku: {
      type: String,
      maxLength: 100,
      unique: true,
      sparse: true,
      trim: true,
      set: function (value) {
        if (!value && this.size && this.color && this.color.name) {
          const cleanColor = this.color.name.replace(/[^a-zA-Z0-9]/g, "");
          return `VAR-${this.size}-${cleanColor}-${Date.now()}`;
        }
        return value;
      },
    },
    price: {
      type: mongoose.Types.Decimal128,
      required: true,
      min: [0, "Giá không được âm"],
      immutable: true, // Không cho chỉnh sửa thủ công
      get: (v) => (v ? parseFloat(v.toString()) : null),
    },
    sale_price: {
      type: mongoose.Types.Decimal128,
      min: 0,
      default: null,
    },
    image: {
      type: {
        url: {
          type: String,
          trim: true,
          validate: {
            validator: function (v) {
              return !v || /^(http|https):\/\/.+/i.test(v);
            },
            message: "URL ảnh không hợp lệ",
          },
        },
        alt: {
          type: String,
          trim: true,
          maxLength: 100,
        },
      },
      required: true,
      default: {
        url: "",
        alt: "",
      },
      validate: {
        validator: function (v) {
          return typeof v === "object";
        },
        message: "Ảnh biến thể phải là object hợp lệ",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true }, // Áp dụng getter cho price
  }
);

// Tạo index phức hợp để tối ưu truy vấn
variantSchema.index(
  { product_id: 1, sku: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sku: { $exists: true, $ne: null },
    },
  }
);

// Middleware tự động xóa variant khi product bị xóa
variantSchema.pre("remove", async function (next) {
  await this.model("Product").updateOne({ _id: this.product_id }, { $pull: { variants: this._id } });
  next();
});

// Khi Variant bị xóa, xóa các item chứa variant đó trong giỏ hàng
variantSchema.pre("remove", async function (next) {
  await Cart.updateMany(
    {},
    {
      $pull: {
        items: {
          "selected_variant.color": this.color.name,
          "selected_variant.size": this.size,
          product: this.product_id,
        },
      },
    }
  );
  next();
});
variantSchema.pre("validate", async function (next) {
  if (this.isNew || this.isModified("product_id")) {
    const product = await Product.findById(this.product_id);
    if (!product) return next(new Error("Không tìm thấy sản phẩm cha"));

    this.price = product.original_price;
  }
  next();
});
// Khi Variant bị xóa, xóa item chứa variant trong cart
variantSchema.pre("remove", async function (next) {
  await Cart.updateMany(
    {},
    {
      $pull: {
        items: {
          "selected_variant.color": this.color.name,
          "selected_variant.size": this.size,
          product: this.product_id,
        },
      },
    }
  );
  next();
});
const Variant = mongoose.model("Variant", variantSchema);
export default Variant;
