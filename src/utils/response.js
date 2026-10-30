import { localize } from "./localize.js";

// With ?lang= on the request (middleware/language.js), translated fields come
// back in that one language; without it, in both.
export const sendSuccess = (res, {statusCode = 200, message = "Success", data = null, meta = undefined} = {}) =>{
  const body = { success: true, message, data: localize(data, res.req?.lang), meta};
  return res.status(statusCode).json(body);
}

export const sendError = (res, {statusCode = 500, message = "Internal server error", detail = undefined} = {}) => {
  const body = { success: false, message, detail};
  return res.status(statusCode).json(body);
}
