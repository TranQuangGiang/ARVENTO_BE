// src/services/ghn.service.js
import axiosGHN from "../utils/axiosInstance.js";
import ghnAxios from "../utils/ghnAxios.js";
import ShippingService from "../models/shippingService.model.js";
import ghnConfig from "../config/ghn.config.js";


const getProvinces = async () => {
  const res = await axiosGHN.get("/master-data/province");
  return res.data.data;
};

const getDistricts = async (province_id) => {
  const res = await axiosGHN.post("/master-data/district", {
    province_id: +province_id,
  });
  return res.data.data;
};

const getWards = async (district_id) => {
  const res = await axiosGHN.post("/master-data/ward", {
    district_id: Number(district_id),
  });
  return res.data.data;
};

export default {
  getProvinces,
  getDistricts,
  getWards,
};

export const calculateShippingFee = async (payload) => {
  console.log("[GHN] Payload gửi tính phí:", payload);
  console.log("[GHN] Token đang dùng:", ghnConfig.token);
  try {
    const { data } = await ghnAxios.post("/v2/shipping-order/fee", payload);
    console.log("[GHN] Response tính phí:", data);
    return data.data;
  } catch (error) {
    console.error("[GHN] Lỗi tính phí:", error.response?.data || error.message);
    throw error;
  }
};

export const createShippingOrder = async (payload) => {
  const { data } = await ghnAxios.post("/v2/shipping-order/create", payload);
  return data.data;
};

export const getOrderDetail = async (orderCode) => {
  const { data } = await ghnAxios.post("/v2/shipping-order/detail", {
    order_code: orderCode
  });
  return data.data;
};

export const getDefaultServiceId = async () => {
  const service = await ShippingService.findOne({
    carrier: "GHN",
    active: true
  });
  return service?.service_id || null;
};
export const getAvailableServices = async (fromDistrict, toDistrict) => {
  const payload = {
    shop_id: parseInt(ghnConfig.shopId),
    from_district: fromDistrict,
    to_district: toDistrict
  };

  const { data } = await ghnAxios.post(
    "/v2/shipping-order/available-services",
    payload
  );

  return data.data;
};