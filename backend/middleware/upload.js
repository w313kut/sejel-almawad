const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const ALLOWED_MIME = [
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/heic", "image/heif", "image/pjpeg", "image/x-png",
  "image/bmp", "image/gif", "image/avif", "image/tiff",
  "application/octet-stream"
];
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".bmp", ".gif", ".avif"];
const MAX_SIZE = 12 * 1024 * 1024; // 12MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const extName = path.extname(file.originalname).toLowerCase();
    const ext = ALLOWED_EXT.includes(extName) ? extName : ".jpg";
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const isImage = (file.mimetype && file.mimetype.startsWith("image/")) || ALLOWED_MIME.includes(file.mimetype);
  if (!isImage) {
    return cb(new Error("نوع الملف غير مدعوم. يرجى التكرم باختيار صورة صالحة"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 1 },
});

module.exports = upload;
