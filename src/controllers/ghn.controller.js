// src/controllers/ghn.controller.js
import ghnService from "../services/ghn.service.js";
import axios from "axios";
import {
  calculateShippingFee,
  createShippingOrder,
  getOrderDetail,
   getDefaultServiceId,
   getAvailableServices 
} from "../services/ghn.service.js";
import cartService from "../services/cart.service.js";
import Order from "../models/order.model.js";
import ghnConfig from "../config/ghn.config.js";

export const getProvinces = async (req, res) => {
  try {
    const data = await ghnService.getProvinces();
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error getting provinces" });
  }
};

export const getDistricts = async (req, res) => {
  try {
    const { province_id } = req.query;
    if (!province_id) {
      return res.status(400).json({ message: "province_id is required" });
    }
    const data = await ghnService.getDistricts(province_id);
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error getting districts" });
  }
};

export const getWards = async (req, res) => {
  try {
    const { district_id } = req.query;
    if (!district_id) {
      return res.status(400).json({ message: "district_id is required" });
    }
    const data = await ghnService.getWards(district_id);
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error getting wards" });
  }
};

export const calculateFee = async (req, res) => {
  try {
    const {
      to_district_id,
      to_ward_code,
      service_id,
    } = req.body;

    const userId = req.user?._id || req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để tính phí ship.",
      });
    }

    // Lấy giỏ hàng
    const cart = await cartService.getCart(userId, false);

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Giỏ hàng trống",
      });
    }

    // Tính tổng số lượng sản phẩm
    const totalQuantity = cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // TÍNH WEIGHT
    const weightPerPair = 500; // gram
    const totalWeight = totalQuantity * weightPerPair;

    // Payload gửi GHN
    const payload = {
      from_district_id: parseInt(ghnConfig.fromDistrictId),
      to_district_id: parseInt(to_district_id),
      to_ward_code,
      service_id,
      weight: totalWeight,
      insurance_value: 0,
    };

    const fee = await calculateShippingFee(payload);

    return res.json({
      success: true,
      data: {
        ...fee,
        calculated_weight: totalWeight,
        total_quantity: totalQuantity,
      },
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi tính phí ship từ GHN.",
    });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate("shipping_address");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (!order.shipping_address) {
      return res.status(400).json({ message: "Order chưa có địa chỉ giao hàng." });
    }

    const weightPerPair = 500;
    const totalQuantity = order.total_quantity || order.items.reduce((sum, i) => sum + i.quantity, 0);
    const weight = totalQuantity * weightPerPair;

    const payload = {
      shop_id: parseInt(ghnConfig.shopId),
      payment_type_id: 1, // shop trả phí ship
      required_note: "KHONGCHOXEMHANG",
      return_phone: ghnConfig.returnPhone,
      return_address: ghnConfig.returnAddress,
      return_district_id: ghnConfig.returnDistrictId,

      client_order_code: order._id.toString(),
      to_name: order.shipping_address.name,
      to_phone: order.shipping_address.phone,
      to_address: order.shipping_address.address_detail,
      to_ward_code: order.shipping_address.ward_code,
      to_district_id: order.shipping_address.district_id,

      weight,
      length: 30,
      width: 20,
      height: 15,
      service_id: order.shipping_service_id,
      items: order.items.map((item) => ({
        name: "Giày",
        quantity: item.quantity,
        price: Number(item.unit_price),
        weight: weightPerPair
      }))
    };

    const ghnOrder = await createShippingOrder(payload);

    // Update order with tracking info
    order.shipping_tracking_code = ghnOrder.order_code;
    await order.save();

    return res.json({
      success: true,
      data: ghnOrder
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi tạo vận đơn GHN."
    });
  }
};


export const orderDetail = async (req, res) => {
  try {
    const { orderCode } = req.params;
    const detail = await getOrderDetail(orderCode);
    return res.json({
      success: true,
      data: detail
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi lấy chi tiết vận đơn GHN."
    });
  }
};
export const getServices = async (req, res) => {
  try {
    const { to_district_id } = req.query;

    if (!to_district_id) {
      return res.status(400).json({
        success: false,
        message: "to_district_id is required",
      });
    }

    const services = await getAvailableServices(
      parseInt(ghnConfig.fromDistrictId),
      parseInt(to_district_id)
    );

    return res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi lấy danh sách dịch vụ GHN.",
    });
  }
};