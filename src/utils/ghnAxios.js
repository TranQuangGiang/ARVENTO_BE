import axios from "axios";
import ghnConfig from "../config/ghn.config.js";

const ghnAxios = axios.create({
  baseURL: ghnConfig.apiUrl,
  headers: {
    Token: ghnConfig.token,
    ShopId: ghnConfig.shopId,
    'Content-Type': 'application/json',
  },
});

export default ghnAxios;
