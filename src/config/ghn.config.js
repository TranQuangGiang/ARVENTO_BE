export default {
  token: process.env.GHN_TOKEN || "YOUR_GHN_TOKEN",
  shopId: process.env.GHN_SHOP_ID || "0",
  apiUrl: process.env.GHN_BASE_URL || "https://online-gateway.ghn.vn/shiip/public-api",
  fromDistrictId: parseInt(process.env.GHN_RETURN_DISTRICT_ID || "0"),
  fromProvinceId: parseInt(process.env.GHN_RETURN_PROVINCE_ID || "0"),
fromWardCode: process.env.GHN_RETURN_WARD_CODE || "",
  returnAddress: process.env.GHN_RETURN_ADDRESS || "",
  returnPhone: process.env.GHN_RETURN_PHONE || "",
};
console.log("GHN_TOKEN:", process.env.GHN_TOKEN);

