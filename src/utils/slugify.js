export const slugify = (str) => {
  return str
    .toString()
    .normalize('NFD')                   // xóa dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, '')    // xóa dấu kết hợp
    .replace(/[^a-zA-Z0-9\s-]/g, '')    // xóa ký tự đặc biệt
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')               // thay khoảng trắng bằng dấu gạch
    .replace(/-+/g, '-');               // bỏ gạch ngang thừa
};