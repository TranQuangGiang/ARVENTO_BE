// src/controllers/ghn.controller.js
import ghnService from "../services/ghn.service.js";
import axios from "axios";

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
