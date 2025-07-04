// src/utils/axiosInstance.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const axiosGHN = axios.create({
  baseURL: process.env.GHN_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Token: process.env.GHN_TOKEN,
  },
});

export default axiosGHN;
