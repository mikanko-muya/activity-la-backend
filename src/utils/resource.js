import { NotFoundError } from "./errors/index.js";

export const assertFound = (row, resource) => {
  if (!row) throw new NotFoundError(`${resource} not found`);
  return row;
};

export const checkExistBy = (find, resource) => async (id) =>
  assertFound(await find(id), resource);
