import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const CartVariantSchema = new mongoose.Schema(
  {
    color: {
      name: {
        type: String,
        required: [true, "Tên màu sắc là bắt buộc"],
        trim: true,
        maxLength: [50, "Tên màu sắc không được vượt quá 50 ký tự"],
      },
      hex: {
        type: String,
        trim: true,
        maxLength: [20, "Mã màu không được vượt quá 20 ký tự"],
        default: null,
      },
    },
    size: {
      type: String,
      required: [true, "Kích cỡ là bắt buộc"],
      trim: true,
      maxLength: [20, "Kích cỡ không được vượt quá 20 ký tự"],
    },
    sku: {
      type: String,
      required: [true, "SKU là bắt buộc"],
      trim: true,
      maxLength: [100, "SKU không được vượt quá 100 ký tự"],
    },
    price: {
      type: mongoose.Types.Decimal128,
      required: [true, "Giá sản phẩm là bắt buộc"],
      min: [0, "Giá sản phẩm không được âm"],
    },
    sale_price: {
      type: mongoose.Types.Decimal128,
      min: [0, "Giá khuyến mãi không được âm"],
      default: null,
    },
    stock: {
      type: Number,
      required: [true, "Số lượng tồn kho là bắt buộc"],
      min: [0, "Số lượng tồn kho không được âm"],
      default: 0,
    },
    image: {
      url: {
        type: String,
        trim: true,
        default: "",
      },
      alt: {
        type: String,
        trim: true,
        maxLength: [100, "Alt text không được vượt quá 100 ký tự"],
        default: "",
      },
    },
  },
  { _id: false }
);

// Schema cho từng item trong giỏ hàng
const CartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "ID sản phẩm là bắt buộc"],
      ref: "Product",
    },
    selected_variant: {
      type: CartVariantSchema,
      required: [true, "Variant sản phẩm là bắt buộc"],
    },
    quantity: {
      type: Number,
      required: [true, "Số lượng là bắt buộc"],
      min: [1, "Số lượng phải ít nhất là 1"],
      max: [999, "Số lượng không được vượt quá 999"],
      default: 1,
    },
    unit_price: {
      type: mongoose.Types.Decimal128,
      required: [true, "Giá đơn vị là bắt buộc"],
      min: [0, "Giá đơn vị không được âm"],
    },
    total_price: {
      type: mongoose.Types.Decimal128,
      required: [true, "Tổng giá là bắt buộc"],
      min: [0, "Tổng giá không được âm"],
    },
    saved_for_later: {
      type: Boolean,
      default: false,
    },
    added_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Schema chính cho giỏ hàng
const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "ID người dùng là bắt buộc"],
      ref: "User",
    },
    items: {
      type: [CartItemSchema],
      default: [],
      validate: [
        {
          validator: function (items) {
            return items.length <= 100;
          },
          message: "Giỏ hàng không được chứa quá 100 sản phẩm",
        },
      ],
    },
    subtotal: {
      type: mongoose.Types.Decimal128,
      default: 0,
      min: [0, "Tổng phụ không được âm"],
    },
    applied_coupon: {
      code: {
        type: String,
        trim: true,
        uppercase: true,
      },
      discount_amount: {
        type: mongoose.Types.Decimal128,
        default: 0,
        min: [0, "Số tiền giảm giá không được âm"],
      },
      discount_type: {
        type: String,
        enum: ["percentage", "fixed", "fixed_amount"],
        default: "percentage",
      },
    },
    total: {
      type: mongoose.Types.Decimal128,
      default: 0,
      min: [0, "Tổng tiền không được âm"],
    },
    expires_at: {
      type: Date,
      default: function () {
        // Cart expires after 30 days of inactivity
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      },
    },
    final_total: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: {
      virtuals: true,
      transform: function (_, ret) {
        // Convert Decimal128 to number for JSON response
        if (ret.subtotal) ret.subtotal = parseFloat(ret.subtotal.toString());
        if (ret.total) ret.total = parseFloat(ret.total.toString());
        if (ret.applied_coupon?.discount_amount) {
          ret.applied_coupon.discount_amount = parseFloat(ret.applied_coupon.discount_amount.toString());
        }
        ret.items.forEach((item) => {
          if (item.unit_price) item.unit_price = parseFloat(item.unit_price.toString());
          if (item.total_price) item.total_price = parseFloat(item.total_price.toString());
          if (item.selected_variant?.price) {
            item.selected_variant.price = parseFloat(item.selected_variant.price.toString());
          }
        });
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtuals
CartSchema.virtual("items_count").get(function () {
  return this.items.filter((item) => !item.saved_for_later).length;
});

CartSchema.virtual("saved_items_count").get(function () {
  return this.items.filter((item) => item.saved_for_later).length;
});

CartSchema.virtual("total_quantity").get(function () {
  return this.items.filter((item) => !item.saved_for_later).reduce((total, item) => total + item.quantity, 0);
});

// Indexes - using unique constraint on user field
CartSchema.index({ user: 1 }, { unique: true });
CartSchema.index({ "items.product": 1 });
CartSchema.index({ "items.saved_for_later": 1 });
CartSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
CartSchema.index({ updated_at: 1 });

// Pre-save middleware để tự động cập nhật totals
CartSchema.pre("save", function (next) {
  try {
    this.updated_at = new Date();
    this.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Reset expiry

    // Tính toán subtotal từ các items không phải "saved for later"
    const activeItems = this.items.filter((item) => !item.saved_for_later);
    const subtotalValue = activeItems.reduce((sum, item) => {
      const itemTotal = parseFloat(item.total_price?.toString() || "0");
      return sum + itemTotal;
    }, 0);

    // Đảm bảo subtotal là Decimal128
    this.subtotal = mongoose.Types.Decimal128.fromString(subtotalValue.toString());

    // Tính total sau khi áp dụng coupon
    let totalValue = subtotalValue;
    if (this.applied_coupon?.discount_amount) {
      const discountAmount = parseFloat(this.applied_coupon.discount_amount.toString() || "0");
      totalValue = Math.max(0, totalValue - discountAmount);
    }

    // Đảm bảo total là Decimal128
    this.total = mongoose.Types.Decimal128.fromString(totalValue.toString());

    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
CartSchema.methods.addItem = function (productId, variant, quantity, unitPrice) {
  try {
    // Validate inputs
    if (!productId || !variant || !quantity || !unitPrice) {
      throw new Error("Missing required parameters for addItem");
    }

    // Tìm item tương tự (cùng product, color, size và không phải saved_for_later)
    const existingItemIndex = this.items.findIndex((item) => item.product.toString() === productId.toString() && item.selected_variant.color.name === variant.color.name && item.selected_variant.size === variant.size && !item.saved_for_later);

    if (existingItemIndex > -1) {
      // Update existing item
      this.items[existingItemIndex].quantity += quantity;
      const newTotalPrice = this.items[existingItemIndex].quantity * parseFloat(unitPrice);
      this.items[existingItemIndex].total_price = mongoose.Types.Decimal128.fromString(newTotalPrice.toString());
      this.items[existingItemIndex].updated_at = new Date();
    } else {
      // Add new item
      const totalPrice = quantity * parseFloat(unitPrice);
      this.items.push({
        product: productId,
        selected_variant: variant,
        quantity: quantity,
        unit_price: mongoose.Types.Decimal128.fromString(unitPrice.toString()),
        total_price: mongoose.Types.Decimal128.fromString(totalPrice.toString()),
        saved_for_later: false,
        added_at: new Date(),
        updated_at: new Date(),
      });
    }

    return this.save();
  } catch (error) {
    throw new Error(`Failed to add item to cart: ${error.message}`);
  }
};

CartSchema.methods.updateItemQuantity = function (productId, variant, newQuantity) {
  try {
    // Validate inputs
    if (!productId || !variant || newQuantity === undefined || newQuantity === null) {
      throw new Error("Missing required parameters for updateItemQuantity");
    }

    const itemIndex = this.items.findIndex((item) => item.product.toString() === productId.toString() && item.selected_variant.color.name === variant.color.name && item.selected_variant.size === variant.size && !item.saved_for_later);

    if (itemIndex === -1) {
      throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
    }

    if (newQuantity <= 0) {
      this.items.splice(itemIndex, 1);
    } else {
      this.items[itemIndex].quantity = newQuantity;
      const newTotalPrice = newQuantity * parseFloat(this.items[itemIndex].unit_price.toString());
      this.items[itemIndex].total_price = mongoose.Types.Decimal128.fromString(newTotalPrice.toString());
      this.items[itemIndex].updated_at = new Date();
    }

    return this.save();
  } catch (error) {
    throw new Error(`Failed to update item quantity: ${error.message}`);
  }
};

CartSchema.methods.removeItem = function (productId, variant) {
  try {
    // Validate inputs
    if (!productId || !variant) {
      throw new Error("Missing required parameters for removeItem");
    }

    const itemIndex = this.items.findIndex((item) => item.product.toString() === productId.toString() && item.selected_variant.color.name === variant.color.name && item.selected_variant.size === variant.size);

    if (itemIndex === -1) {
      throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
    }

    this.items.splice(itemIndex, 1);
    return this.save();
  } catch (error) {
    throw new Error(`Failed to remove item: ${error.message}`);
  }
};

CartSchema.methods.clearCart = function () {
  this.items = [];
  this.applied_coupon = {};
  return this.save();
};

CartSchema.methods.saveForLater = function (productId, variant) {
  try {
    if (!productId || !variant) {
      throw new Error("Missing required parameters for saveForLater");
    }

    const itemIndex = this.items.findIndex((item) => item.product.toString() === productId.toString() && item.selected_variant.color.name === variant.color.name && item.selected_variant.size === variant.size && !item.saved_for_later);

    if (itemIndex === -1) {
      throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
    }

    this.items[itemIndex].saved_for_later = true;
    this.items[itemIndex].updated_at = new Date();
    return this.save();
  } catch (error) {
    throw new Error(`Failed to save for later: ${error.message}`);
  }
};

CartSchema.methods.moveToCart = function (productId, variant) {
  try {
    if (!productId || !variant) {
      throw new Error("Missing required parameters for moveToCart");
    }

    const itemIndex = this.items.findIndex((item) => item.product.toString() === productId.toString() && item.selected_variant.color.name === variant.color.name && item.selected_variant.size === variant.size && item.saved_for_later);

    if (itemIndex === -1) {
      throw new Error("Sản phẩm không tồn tại trong danh sách lưu sau");
    }

    this.items[itemIndex].saved_for_later = false;
    this.items[itemIndex].updated_at = new Date();
    return this.save();
  } catch (error) {
    throw new Error(`Failed to move to cart: ${error.message}`);
  }
};

CartSchema.methods.applyCoupon = function (couponCode, discountAmount, discountType = "percentage") {
  try {
    if (!couponCode || discountAmount === undefined || discountAmount === null) {
      throw new Error("Missing required parameters for applyCoupon");
    }

    this.applied_coupon = {
      code: couponCode.toUpperCase(),
      discount_amount: mongoose.Types.Decimal128.fromString(discountAmount.toString()),
      discount_type: discountType,
    };
    return this.save();
  } catch (error) {
    throw new Error(`Failed to apply coupon: ${error.message}`);
  }
};

CartSchema.methods.removeCoupon = function () {
  try {
    this.applied_coupon = {};
    return this.save();
  } catch (error) {
    throw new Error(`Failed to remove coupon: ${error.message}`);
  }
};

// Static methods
CartSchema.statics.findByUser = function (userId) {
  return this.findOne({ user: userId }).populate("items.product");
};

CartSchema.statics.createForUser = function (userId) {
  return this.create({ user: userId });
};

// Plugin
CartSchema.plugin(mongoosePaginate);

export default mongoose.model("Cart", CartSchema);
