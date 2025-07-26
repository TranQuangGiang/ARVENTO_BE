import orderService from "../services/order.service.js";
import userService from "../services/user.service.js";
import productService from "../services/product.service.js";
import couponService from "../services/coupon.service.js";
import dayjs from "dayjs";
import userModel from "../models/user.model.js";
import Product from "../models/product.model.js";
import orderModel from "../models/order.model.js";

const getRevenueByDateFullFill = async ({ from, to, groupBy = "day" }) => {
  const match = { status: "completed" };
  if (from || to) match.createdAt = {};
  if (from) match.createdAt.$gte = new Date(from);
  if (to) match.createdAt.$lte = new Date(to);

  const dateFormat = groupBy === "month" ? { $dateToString: { format: "%Y-%m", date: "$createdAt" } } : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

  const rawData = await orderModel.aggregate([{ $match: match }, { $group: { _id: dateFormat, revenue: { $sum: "$total" } } }, { $sort: { _id: 1 } }]);

  const start = dayjs(from);
  const end = dayjs(to);
  const dates = [];
  let current = start;

  while (current.isBefore(end) || current.isSame(end)) {
    dates.push(current.format(groupBy === "month" ? "YYYY-MM" : "YYYY-MM-DD"));
    current = groupBy === "month" ? current.add(1, "month") : current.add(1, "day");
  }

  const revenueMap = Object.fromEntries(rawData.map((r) => [r._id, r.revenue]));

  const result = dates.map((date) => ({
    date,
    revenue: revenueMap[date] || 0,
  }));

  return result;
};

const getOrderStatusStats = async () => {
  const result = await orderModel.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  return result.map((r) => ({
    status: r._id,
    count: r.count,
  }));
};

const getSystemOverview = async () => {
  const [userCount, orderCount, productCount, couponCount] = await Promise.all([userService.countUsers(), orderService.countOrders(), productService.countProducts(), couponService.countCoupons()]);

  return { userCount, orderCount, productCount, couponCount };
};

const getTopSellingProducts = async (limit = 5) => {
  const results = await orderModel.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        quantity: { $sum: "$items.quantity" },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $project: {
        _id: 0,
        product_id: "$_id",
        name: "$product.name",
        quantity: 1,
        image: { $arrayElemAt: ["$product.images", 0] },
      },
    },
  ]);
  return results;
};

const getNewUsers = async ({ from, to }) => {
  const filter = {};
  if (from || to) filter.createdAt = {};
  if (from) filter.createdAt.$gte = new Date(from);
  if (to) filter.createdAt.$lte = new Date(to);
  return await userModel.countDocuments(filter);
};

const getTopDiscountUsed = async () => {
  const result = await orderModel.aggregate([
    {
      $match: {
        discount_code: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: "$discount_code",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        code: "$_id",
        count: 1,
        _id: 0,
      },
    },
  ]);
  return result;
};

const getStockWarning = async (threshold = 10) => {
  const products = await Product.find({ stock: { $lt: threshold } })
    .select("name stock images")
    .limit(50);
  return products;
};

export default {
  getRevenueByDateFullFill,
  getOrderStatusStats,
  getSystemOverview,
  getTopSellingProducts,
  getNewUsers,
  getTopDiscountUsed,
  getStockWarning,
};
