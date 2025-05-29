const parseQueryParams = (query, allowedFields = {}) => {
  const filters = {};

  // === GLOBAL SEARCH ===
  if (query.search) {
    const keyword = query.search.trim();
    filters.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      // Add more fields
    ];
  }

  // === FIELD FILTERS ===
  for (const field in allowedFields) {
    if (query[field]) {
      if (field === 'color' || field === 'size') {
        // filter trong mảng variants
        if (!filters['variants']) filters['variants'] = {};
        if (!filters['variants'].$elemMatch) filters['variants'].$elemMatch = {};
        filters['variants'].$elemMatch[field] = query[field];
      } else {
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
          case 'in':
            filters[field] = { $in: query[field].split(',') };
            break;
        }
      }
    }
  }


  // === PRICE RANGE ===
  if (query.priceMin || query.priceMax) {
    filters.price = {};
    if (query.priceMin) filters.price.$gte = Number(query.priceMin);
    if (query.priceMax) filters.price.$lte = Number(query.priceMax);
  }

  // === PAGINATION ===
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;

  // === SORTING ===
  const sortField = query.sortBy || 'createdAt';
  const sortOrder = query.order === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  return { filters, sort, page, limit };
};


export default parseQueryParams;

