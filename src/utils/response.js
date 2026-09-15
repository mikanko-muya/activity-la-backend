export const sendSuccess = (res, {statusCode = 200, message = "Success", data = null, meta = undefined} = {}) =>{
  const body = { success: true, message, data, meta};
  return res.status(statusCode).json(body);
}

export const sendError = (res, {statusCode = 500, message = "Internal server error", detail = undefined} = {}) => {
  const body = { success: false, message, detail};
  return res.status(statusCode).json(body);
}
