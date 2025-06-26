import Review from '../models/review.model.js';
import Order from '../models/order.model.js';
import mongoose from 'mongoose';
const create = async (userId, body) => {
  const productId = new mongoose.Types.ObjectId(body.product_id);

  // Kiểm tra đã đánh giá sản phẩm chưa
  const existed = await Review.findOne({
    user_id: userId,
    product_id: productId,
  });
  if (existed) throw new Error('Bạn đã đánh giá sản phẩm này rồi.');

  // Kiểm tra user đã mua sản phẩm đó chưa (trong đơn hàng đã hoàn tất)
  const hasPurchased = await Order.exists({
    user: userId,
    status: 'completed',
    'items.product': productId,
  });
  if (!hasPurchased) {
    throw new Error('Bạn chỉ có thể đánh giá sản phẩm sau khi mua và nhận hàng.');
  }

  // Tạo đánh giá
  return await Review.create({
    ...body,
    product_id: productId,
    user_id: userId,
  });
};

const getByProduct = async (productId, query) => {
  const { page = 1, limit = 10, sortBy = 'created_at', order = 'desc', minRating, maxRating } = query;
  const filter = { product_id: productId, approved: true, hidden: false };
  if (minRating) filter.rating = { ...filter.rating, $gte: Number(minRating) };
  if (maxRating) filter.rating = { ...filter.rating, $lte: Number(maxRating) };

  const reviews = await Review.find(filter)
    .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('user_id', 'name');

  const total = await Review.countDocuments(filter);
  const ratingAvg = await Review.aggregate([
    { $match: filter },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    ratingAvg: ratingAvg[0]?.avg || 0,
    reviews
  };
};

const getByUser = async (userId) => {
  return await Review.find({ user_id: userId });
};

const update = async (userId, reviewId, data) => {
  const review = await Review.findOneAndUpdate(
    { _id: reviewId, user_id: userId },
    { ...data, updated_at: new Date(), approved: false },
    { new: true }
  );
  if (!review) throw new Error('Không tìm thấy đánh giá hoặc không có quyền.');
  return review;
};


const remove = async (userId, reviewId) => {
  const result = await Review.findOneAndDelete({ _id: reviewId, user_id: userId });
  if (!result) throw new Error('Không tìm thấy hoặc không có quyền.');
};

const getAll = async (query) => {
  const { page = 1, limit = 20, sortBy = 'created_at', order = 'desc', keyword, approved, hidden } = query;
  const filter = {};
  if (keyword) filter.comment = { $regex: keyword, $options: 'i' };
  if (approved !== undefined) filter.approved = approved === 'true';
  if (hidden !== undefined) filter.hidden = hidden === 'true';

  const reviews = await Review.find(filter)
    .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('user_id', 'name')
    .populate('product_id', 'name');

  const total = await Review.countDocuments(filter);

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    reviews
  };
};

const approve = async (id) => await Review.findByIdAndUpdate(id, { approved: true }, { new: true });
const hide = async (id) => await Review.findByIdAndUpdate(id, { hidden: true }, { new: true });
const reply = async (id, reply) => await Review.findByIdAndUpdate(id, { reply }, { new: true });
const deleteByAdmin = async (id) => await Review.findByIdAndDelete(id);

const getStatsByProduct = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product_id: new mongoose.Types.ObjectId(productId), approved: true, hidden: false } },
    { $group: {
      _id: "$rating",
      count: { $sum: 1 }
    }},
    { $sort: { _id: -1 } }
  ]);

  const average = await Review.aggregate([
    { $match: { product_id: new mongoose.Types.ObjectId(productId), approved: true, hidden: false } },
    { $group: { _id: null, avg: { $avg: "$rating" }, total: { $sum: 1 } } }
  ]);

  return {
    distribution: stats,
    average: average[0]?.avg || 0,
    total: average[0]?.total || 0
  };
};

const getDashboardStats = async () => {
  // 1. Thống kê theo tháng
  const monthlyAgg = await Review.aggregate([
    { $match: { approved: true } },
    {
      $group: {
        _id: {
          year: { $year: "$created_at" },
          month: { $month: "$created_at" }
        },
        total: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } }
  ]);

  const monthly = monthlyAgg.map(item => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    total: item.total
  }));

  // 2. Thống kê theo số sao (1–5)
  const byRatingAgg = await Review.aggregate([
    { $match: { approved: true } },
    {
      $group: {
        _id: "$rating",
        total: { $sum: 1 }
      }
    }
  ]);

  // Tạo object với mặc định tất cả sao từ 1–5 đều = 0
  const byRating = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  byRatingAgg.forEach(item => {
    byRating[item._id] = item.total;
  });

  return { monthly, byRating };
};


export default {
  create,
  getByProduct,
  getByUser,
  update,
  remove,
  getAll,
  approve,
  hide,
  reply,
  deleteByAdmin,
  getStatsByProduct,
  getDashboardStats,
};
