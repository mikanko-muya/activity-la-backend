import multer from "multer"

const storage = multer.memoryStorage();
const allowedMimetypes = ["image/jpeg", "image/png", "image/webp", ];
const maxfileSize = 5 * 1024 * 1024;

export const upload = multer({
    storage,
    limits: {fileSize: maxfileSize},
    fileFilter: (req, file, cb) => {

        if (!allowedMimetypes.includes(file.mimetype)) {
            return cb(new BadRequestError(`Unsupported image type "${file.mimetype}"`));
        }

        cb(null, true);
    }
})
