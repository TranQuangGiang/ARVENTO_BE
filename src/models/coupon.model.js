import mongoose from 'mongoose';
const { Schema } = mongoose;

const couponSchema = new Schema(
    {
        // === THÔNG TIN CƠ BẢN ===
        code: {
            type: String,
            required: [true, 'Mã coupon là bắt buộc'],
            unique: true,
            trim: true,
            uppercase: true, // Lưu mã in hoa để tránh phân biệt hoa thường
            match: [/^[A-Z0-9]+$/, 'Mã chỉ được chứa chữ in hoa và số'], // Ví dụ: SALE10
        },
        discountType: {
            type: String,
            required: [true, 'Loại giảm giá là bắt buộc'],
            enum: {
                values: ['percentage', 'fixed_amount'],
                message: 'Loại giảm giá phải là percentage, fixed_amount',
            },
        },
        discountValue: {
            type: Number,
            required: [true, 'Vui lòng nhập giá trị giảm giá'],
            min: [0, 'Giá trị giảm giá không được âm'],
            validate: {
                validator: function (value) {
                    if (this.discountType === 'percentage') {
                        return value <= 100;
                    }
                    return true;
                },
                message: 'Giảm giá phần trăm tối đa 100%',
            },
        },

        description: {
            type: String,
            maxlength: [500, 'Mô tả tối đa 500 ký tự'],
        },

        // === GIỚI HẠN SỬ DỤNG ===
        usageLimit: {
            type: Number,
            min: [1, 'Giới hạn sử dụng tối thiểu là 1'],
            default: null, // null = không giới hạn
        },
        usageCount: {
            type: Number,
            default: 0,
            min: [0, 'Số lần sử dụng không được âm'],
        },
        perUserLimit: {
            type: Number,
            default: 1,
            min: [1, 'Mỗi user phải được dùng ít nhất 1 lần'],
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        expiryDate: {
            type: Date,
        },

        // === ĐIỀU KIỆN ÁP DỤNG ===
        minSpend: {
            type: Number,
            min: [0, 'Số tiền tối thiểu không được âm'],
            default: 0,
        },
        maxSpend: {
            type: Number,
            min: [0, 'Số tiền tối đa không được âm'],
            default: null, // null = không giới hạn
        },
        products: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
        ], // Sản phẩm được áp dụng
        excludedProducts: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
        ], // Sản phẩm không được áp dụng
        categories: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Category',
            },
        ], // Danh mục được áp dụng
        excludedCategories: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Category',
            },
        ], // Danh mục không được áp dụng
        // === TÙY CHỌN ĐẶC BIỆT ===
        allowFreeShipping: {
            type: Boolean,
            default: false,
        },
        excludeSaleItems: {
            type: Boolean,
            default: false,
        },
        individualUse: {
            type: Boolean,
            default: false,
        },
        userRestrictions: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // Tự động thêm createdAt và updatedAt
    }
);

// Middleware: Tự động chuyển code thành chữ in hoa trước khi lưu
couponSchema.pre('save', function (next) {
    if (this.code) {
        this.code = this.code.toUpperCase();
    }
    next();
});

// Phương thức kiểm tra coupon còn hiệu lực
couponSchema.methods.isValid = function () {
    const now = new Date();
    return (
        this.isActive &&
        (this.usageLimit === null || this.usageCount < this.usageLimit) &&
        (!this.expiryDate || this.expiryDate >= now)
    );
};
export default mongoose.model('Coupon', couponSchema);