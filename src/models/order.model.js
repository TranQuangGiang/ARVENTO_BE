import mongoose from "mongoose";

// Schema cho variant của sản phẩm trong đơn hàng (tương tự cart)
const OrderVariantSchema = new mongoose.Schema(
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

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "ID sản phẩm là bắt buộc"],
    },
    product_snapshot: {
      _id: String,
      product_code: String,
      name: String,
      slug: String,
      description: String,
      original_price: Number,
      stock: Number,
      images: [
        {
          url: String,
          alt: String,
        },
      ],
      tags: [String],
      options: mongoose.Schema.Types.Mixed,
      isActive: Boolean,
      is_manual: Boolean,
    },

    user_snapshot: {
      _id: String,
      name: String,
      email: String,
      phone: String,
      verified: Boolean,
      role: {
        type: String,
        enum: ["user", "admin"],
      },
      status: {
        type: String,
        enum: ["active", "blocked", "banned"],
      },
      total_spending: Number,
    },

    selected_variant: {
      type: OrderVariantSchema,
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
    // Backward compatibility - deprecated fields
    price: {
      type: Number,
      required: false, // Made optional for backward compatibility
    },
    variant: {
      type: Object,
      default: null, // Kept for backward compatibility
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID người dùng là bắt buộc"],
    },
    items: {
      type: [orderItemSchema],
      required: [true, "Danh sách sản phẩm là bắt buộc"],
      validate: [
        {
          validator: function (items) {
            return items.length > 0 && items.length <= 100;
          },
          message: "Đơn hàng phải có ít nhất 1 sản phẩm và không quá 100 sản phẩm",
        },
      ],
    },
    subtotal: {
      type: mongoose.Types.Decimal128,
      required: [true, "Tổng phụ là bắt buộc"],
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
    applied_point_discount: {
      type: mongoose.Types.Decimal128,
      default: 0,
      min: 0,
    },
    total: {
      type: mongoose.Types.Decimal128,
      required: [true, "Tổng tiền là bắt buộc"],
      min: [0, "Tổng tiền không được âm"],
    },
    shipping_address: {
      type: Object,
      required: true,
    },
    billing_address: {
      type: Object,
      required: false,
    },
    shipping_fee: {
      type: mongoose.Types.Decimal128,
      default: 0,
      min: 0,
    },
    payment_method: {
      type: String,
      enum: ["cod", "banking", "zalopay", "momo"],
      default: "cod",
    },
    payment_status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled", "refunded"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipping", "delivered", "completed", "cancelled", "returned", "returning"],
      default: "pending",
    },
    is_return_requested: { type: Boolean, default: false },
    note: {
      type: String,
      trim: true,
      maxLength: [500, "Ghi chú không được vượt quá 500 ký tự"],
    },
    timeline: [
      {
        status: {
          type: String,
          required: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          trim: true,
        },
      },
    ],
    // Backward compatibility fields
    address: {
      type: Object,
      required: false, // Made optional for backward compatibility
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: {
      virtuals: true,
      transform: function (_, ret) {
        if (ret.subtotal) ret.subtotal = parseFloat(ret.subtotal.toString());
        if (ret.total) ret.total = parseFloat(ret.total.toString());
        if (ret.shipping_fee) ret.shipping_fee = parseFloat(ret.shipping_fee.toString());

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
orderSchema.virtual("items_count").get(function () {
  return this.items.length;
});

orderSchema.virtual("total_quantity").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

orderSchema.virtual("discount_amount").get(function () {
  return this.applied_coupon?.discount_amount ? parseFloat(this.applied_coupon.discount_amount.toString()) : 0;
});

orderSchema.virtual("final_total").get(function () {
  const subtotal = parseFloat(this.subtotal?.toString() || "0");
  const discount = this.discount_amount;
  return Math.max(0, subtotal - discount);
});

// Indexes
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ created_at: -1 });
orderSchema.index({ "items.product": 1 });
orderSchema.index({ payment_status: 1 });
orderSchema.index({ shipping_address: 1 });

// Static methods
orderSchema.statics.findByUser = function (userId) {
  return this.find({ user: userId }).sort({ created_at: -1 });
};

orderSchema.statics.findByStatus = function (status) {
  return this.find({ status }).sort({ created_at: -1 });
};

orderSchema.statics.findPendingOrders = function () {
  return this.find({ status: "pending" }).sort({ created_at: -1 });
};

// Instance methods
orderSchema.methods.canBeCancelled = function () {
  return ["pending", "confirmed"].includes(this.status);
};

orderSchema.methods.canBeModified = function () {
  return ["pending"].includes(this.status);
};

export default mongoose.model("Order", orderSchema);
