const parseQueryParams = (
  query,
  allowedFields = {},
  rangeFields = ['price'],
  defaultSortField = 'createdAt',
  defaultLimit = 10,
  maxLimit = 50
) => {
  const filters = {};

  if (query.search) {
    const keyword = query.search.trim();
    filters.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
    ];
  }

  for (const field in allowedFields) {
    if (query[field]) {
      if (field === 'color' || field === 'size') {
        if (!filters.variants) filters.variants = {};
        if (!filters.variants.$elemMatch) filters.variants.$elemMatch = {};
        filters.variants.$elemMatch[field] = query[field];
      } else {
        const value = query[field];
        switch (allowedFields[field]) {
          case 'string':
            filters[field] = { $regex: value, $options: 'i' };
            break;
          case 'number':
            filters[field] = Number(value);
            break;
          case 'boolean':
            filters[field] = value === 'true';
            break;
          case 'array':
          case 'in':
            filters[field] = { $in: value.split(',').map(s => s.trim()) };
            break;
          case 'date':
            filters[field] = new Date(value);
            break;
          case 'exact':
            filters[field] = value;
            break;
        }
      }
    }
  }

  rangeFields.forEach(field => {
    const min = query[`${field}Min`];
    const max = query[`${field}Max`];
    if (min !== undefined || max !== undefined) {
      filters[field] = {};
      if (min !== undefined) filters[field].$gte = Number(min);
      if (max !== undefined) filters[field].$lte = Number(max);
    }
  });

  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || defaultLimit, maxLimit);

  const sortField = query.sortBy || defaultSortField;
  const sortOrder = query.order === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  return { filters, sort, page, limit };
};

export default parseQueryParams;
