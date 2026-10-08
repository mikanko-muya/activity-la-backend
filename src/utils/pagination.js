export const buildMeta = ({ total, page, limit }) => ({
  total,
  page,
  limit,
  totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
});

export const paginateArgs = ({ page, limit, sortBy, sortOrder }) => ({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { [sortBy]: sortOrder },
});

export const toPaginated = ({ data, total }, query, map) => ({
  data: map ? data.map(map) : data,
  meta: buildMeta({ total, page: query.page, limit: query.limit }),
});
