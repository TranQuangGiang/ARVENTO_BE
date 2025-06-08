const productCleanConfig = {
  name: { type: 'string', slugify: true, slugField: 'slug' },
  price: { type: 'number', isFloat: true },
  stock: { type: 'number', isFloat: false },
  tags: { type: 'array' },
  images: { type: 'array' },
  variants: { type: 'json' },
};

export default {
  productCleanConfig
}