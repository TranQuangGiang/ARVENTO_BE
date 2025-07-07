// src/services/ghn.service.js
import axiosGHN from "../utils/axiosInstance.js";



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

