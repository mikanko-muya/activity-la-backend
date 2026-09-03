export const validateData = async (data) => {
  return Object.keys(data).filter((key) => !data[key]);
};
