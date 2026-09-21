// Replaces the old getPagination helper, which nothing imported: the zod DTOs
// already coerce page/limit and the repositories compute skip/take from them.
// What was actually duplicated was the response meta, in two copies that had
// already drifted - category divided by query.page instead of query.limit.
export const buildMeta = ({ total, page, limit }) => ({
  total,
  page,
  limit,
  // The DTOs enforce limit >= 1, but a direct service call could pass 0 and
  // hand the client totalPages: Infinity.
  totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
});
