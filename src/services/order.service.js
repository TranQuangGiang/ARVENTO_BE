import Order from "../models/order.model.js";
import { productModel } from "../models/index.js";
import ExcelJS from "exceljs";

const checkAndUpdateStock = async (items) => {
  const errors = [];
  const updates = [];

  for (const item of items) {
    const product = await productModel.findById(item.product);
    if (!product) {
      errors.push({
        product: item.product,
        message: "Sản phẩm không tồn tại",
      });
      continue;
    }
    // Nếu có variant
    if (item.variant && Object.keys(item.variant).length > 0) {
      const idx = product.variants.findIndex((v) => {
        let match = true;
        for (const key in item.variant) {
          if (item.variant[key] !== v[key]) match = false;
        }
        return match;
      });
      if (idx === -1) {
        errors.push({
          product: item.product,
          variant: item.variant,
          message: "Biến thể không tồn tại",
        });
        continue;
      }
      if (product.variants[idx].stock < item.quantity) {
        errors.push({
          product: item.product,
          variant: item.variant,
          message: `Không đủ tồn kho biến thể (còn ${product.variants[idx].stock})`,
        });
        continue;
      }
      // Trừ tồn kho biến thể
      product.variants[idx].stock -= item.quantity;
      updates.push(product.save());
    } else {
      // Không có variant, kiểm tra tổng tồn kho (nếu có trường stock tổng)
      if (product.stock !== undefined) {
        if (product.stock < item.quantity) {
          errors.push({
            product: item.product,
            message: `Không đủ tồn kho sản phẩm (còn ${product.stock})`,
          });
          continue;
        }
        product.stock -= item.quantity;
        updates.push(product.save());
      } else {
        errors.push({
          product: item.product,
          message: "Sản phẩm không có trường tồn kho tổng hoặc biến thể",
        });
      }
    }
  }
  if (errors.length > 0) {
    const err = new Error("Lỗi kiểm tra tồn kho");
    err.details = errors;
    throw err;
  }
  await Promise.all(updates);
};

const createOrder = async ({ user, items, total, address, note }) => {
  await checkAndUpdateStock(items);
  return await Order.create({ user, items, total, address, note });
};

const getMyOrders = async (user) => {
  return await Order.find({ user }).sort({ createdAt: -1 });
};

const getOrderDetail = async (id) => {
  return await Order.findById(id).populate("items.product");
};

const cancelOrder = async (orderId, userId) => {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error("Không tìm thấy đơn hàng");
    err.status = 404;
    throw err;
  }
  // Chỉ cho phép hủy nếu là chủ đơn và trạng thái còn pending/confirmed
  if (order.user.toString() !== userId.toString()) {
    const err = new Error("Bạn không có quyền hủy đơn hàng này");
    err.status = 403;
    throw err;
  }
  if (!["pending", "confirmed"].includes(order.status)) {
    const err = new Error("Chỉ có thể hủy đơn hàng khi đang chờ xác nhận hoặc đã xác nhận");
    err.status = 400;
    throw err;
  }
  order.status = "cancelled";
  await order.save();

  for (const item of order.items) {
    const product = await productModel.findById(item.product);
    if (!product) continue;
    if (item.variant && Object.keys(item.variant).length > 0) {
      const idx = product.variants.findIndex((v) => {
        let match = true;
        for (const key in item.variant) {
          if (item.variant[key] !== v[key]) match = false;
        }
        return match;
      });
      if (idx !== -1) {
        product.variants[idx].stock += item.quantity;
        await product.save();
      }
    } else if (product.stock !== undefined) {
      product.stock += item.quantity;
      await product.save();
    }
  }
  return order;
};
const getAllOrders = async (filters = {}, options = {}) => {
  // filters: { status, user, dateFrom, dateTo, ... }
  // options: { page, limit, sort }
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.user) query.user = filters.user;
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }
  const page = options.page || 1;
  const limit = options.limit || 20;
  const sort = options.sort || { createdAt: -1 };
  const orders = await Order.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user")
    .populate("items.product");
  const total = await Order.countDocuments(query);
  return { orders, total, page, limit };
};
// Lưu lịch sử trạng thái đơn hàng (timeline)
const addOrderTimeline = async (orderId, status, changedBy) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (!order.timeline) order.timeline = [];
  order.timeline.push({
    status,
    changedBy,
    changedAt: new Date(),
  });
  await order.save();
  return order.timeline;
};

// Lấy lịch sử trạng thái đơn hàng
const getOrderTimeline = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  return order.timeline || [];
};

// Cập nhật trạng thái đơn hàng (admin)
const updateOrderStatus = async (orderId, status, changedBy) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  order.status = status;
  if (!order.timeline) order.timeline = [];
  order.timeline.push({
    status,
    changedBy,
    changedAt: new Date(),
  });
  await order.save();
  return order;
};
const getRecentOrders = async (limit = 10) => {
  return await Order.find().sort({ createdAt: -1 }).limit(limit).populate("user").populate("items.product");
};
const getRevenueByDate = async ({ from, to, groupBy = "day" }) => {
  const match = { status: "completed" };
  if (from || to) match.createdAt = {};
  if (from) match.createdAt.$gte = new Date(from);
  if (to) match.createdAt.$lte = new Date(to);

  const dateFormat = groupBy === "month" ? { $dateToString: { format: "%Y-%m", date: "$createdAt" } } : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

  const result = await Order.aggregate([{ $match: match }, { $group: { _id: dateFormat, revenue: { $sum: "$total" } } }, { $sort: { _id: 1 } }]);
  return result.map((r) => ({ date: r._id, revenue: r.revenue }));
};

const countOrdersByStatus = async () => {
  const result = await Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const stats = {};
  result.forEach((r) => {
    stats[r._id] = r.count;
  });
  return stats;
};
const sumOrderRevenue = async () => {
  const result = await Order.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$total" } } }]);
  return result[0]?.total || 0;
};
const countAllOrders = async () => {
  return await Order.countDocuments();
};
const exportOrders = async (filters = {}) => {
  // Lọc đơn hàng theo from, to, status, user...
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.user) query.user = filters.user;
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }
  const orders = await Order.find(query).populate("user").populate("items.product");

  // Tạo Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Orders");
  worksheet.columns = [
    { header: "Mã đơn", key: "_id", width: 24 },
    { header: "Khách hàng", key: "user", width: 24 },
    { header: "Tổng tiền", key: "total", width: 14 },
    { header: "Trạng thái", key: "status", width: 14 },
    { header: "Ngày tạo", key: "createdAt", width: 20 },
    { header: "Sản phẩm", key: "items", width: 40 },
    { header: "Địa chỉ", key: "address", width: 30 },
    { header: "Ghi chú", key: "note", width: 20 },
  ];
  orders.forEach((order) => {
    worksheet.addRow({
      _id: order._id.toString(),
      user: order.user?.name || order.user?.email || order.user?.toString(),
      total: order.total,
      status: order.status,
      createdAt: order.createdAt.toLocaleString("vi-VN"),
      items: order.items
        .map(
          (i) =>
            `${i.product?.name || i.product?.toString()} x${i.quantity}` +
            (i.variant && Object.keys(i.variant).length > 0
              ? ` (${Object.entries(i.variant)
                  .map(([k, v]) => `${k}:${v}`)
                  .join(", ")})`
              : "")
        )
        .join("; "),
      address: order.address?.detail || "",
      note: order.note || "",
    });
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer,
    filename: `orders_${Date.now()}.xlsx`,
    mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
};

export default {
  getAllOrders,
  exportOrders,
  createOrder,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  addOrderTimeline,
  getOrderTimeline,
  updateOrderStatus,
  countAllOrders,
  sumOrderRevenue,
  countOrdersByStatus,
  getRevenueByDate,
  getRecentOrders,
};
