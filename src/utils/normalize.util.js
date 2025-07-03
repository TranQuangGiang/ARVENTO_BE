/**
 * Viết hoa chữ cái đầu của mỗi từ
 * Ví dụ: "dark green" → "Dark Green"
 */
export const capitalizeWords = (str = "") => {
  return str
    .toLowerCase()
    .split(' ')
    .filter(s => s.length > 0)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
};

/**
 * Chuẩn hóa size:
 * - chuyển tất cả thành chữ HOA
 * - trim khoảng trắng
 */
export const normalizeSize = (val = "") => {
  return val.trim().toUpperCase();
};

/**
 * Chuẩn hóa color:
 * - name: viết hoa chữ cái đầu, lower các chữ còn lại
 * - hex: viết HOA toàn bộ, trim
 */
export const normalizeColor = ({ name = "", hex = "" }) => {
  return {
    name: capitalizeWords(name.trim()),
    hex: hex.trim().toUpperCase(),
  };
};

/**
 * Hàm normalizeOptionValues tổng hợp
 * Dùng nếu bạn muốn giữ hàm gộp key + values
 */
export const normalizeOptionValues = (key, values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  if (key === 'color') {
    return values.map(v => normalizeColor({
      name: v?.name || "",
      hex: v?.hex || "",
    }));
  } else {
    return values.map(v => normalizeSize(v || ""));
  }
};

/**
 * Kiểm tra trùng lặp trong mảng values
 * Trả về giá trị trùng đầu tiên nếu có, nếu không thì trả về null
 */
export const checkDuplicateValues = (values, key) => {
  const seen = new Set();
  let duplicate = null;

  if (key === 'color') {
    for (const v of values) {
      const name = (v.name || "").toLowerCase().trim();
      if (seen.has(name)) {
        duplicate = v.name;
        break;
      }
      seen.add(name);
    }
  } else {
    for (const v of values) {
      const val = (v || "").toLowerCase().trim();
      if (seen.has(val)) {
        duplicate = v;
        break;
      }
      seen.add(val);
    }
  }

  return duplicate;
};
