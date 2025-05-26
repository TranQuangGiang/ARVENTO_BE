export const parseQueryParams = (query, allowedFields = {}) => {
  const filters = {};

  for (const field in allowedFields) {
    if (query[field]) {
      switch (allowedFields[field]) {
        case 'string':
          filters[field] = { $regex: query[field], $options: 'i' };
          break;
        case 'number':
          filters[field] = Number(query[field]);
          break;
        case 'array':
          filters[field] = { $in: query[field].split(',') };
          break;
        case 'date':
          filters[field] = new Date(query[field]);
          break;
        case 'exact':
          filters[field] = query[field];
          break;
      }
    }
  }

  if (query.priceMin || query.priceMax) {
    filters.price = {};
    if (query.priceMin) filters.price.$gte = Number(query.priceMin);
    if (query.priceMax) filters.price.$lte = Number(query.priceMax);
  }

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;

  const sortField = query.sortBy || 'createdAt';
  const sortOrder = query.order === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  return { filters, sort, page, limit };
};
