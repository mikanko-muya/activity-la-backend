import { v2 as cloudinary } from "cloudinary";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from "../config/globalkey.js";
import { BadRequestError } from "./errors/index.js";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export const uploadImageBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder ?? "ACTIVITY_LA_CLOUDINARY_FOLDER",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(new BadRequestError(`Cloudinary image upload failed: ${error.message}`))
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      })

    stream.end(buffer)
  });
};

export const deleteImageFromCloudinary = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
}
