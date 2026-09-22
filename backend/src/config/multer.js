const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Allowed MIME types by category
const ALLOWED_TYPES = {
  photo: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

// Max file sizes in bytes
const MAX_SIZES = {
  photo: parseInt(process.env.MAX_PHOTO_SIZE, 10) || 5 * 1024 * 1024,       // 5MB
  video: parseInt(process.env.MAX_VIDEO_SIZE, 10) || 50 * 1024 * 1024,      // 50MB
  document: parseInt(process.env.MAX_DOC_SIZE, 10) || 10 * 1024 * 1024,     // 10MB
};

/**
 * Determine file type category from MIME type
 */
function getFileType(mimetype) {
  for (const [type, mimes] of Object.entries(ALLOWED_TYPES)) {
    if (mimes.includes(mimetype)) return type;
  }
  return null;
}

/**
 * Check if a MIME type is allowed
 */
function isAllowedType(mimetype) {
  return getFileType(mimetype) !== null;
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const challengeId = req.params.id;
    const dir = path.join(UPLOAD_DIR, challengeId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (!isAllowedType(file.mimetype)) {
    const error = new Error(
      `File type "${file.mimetype}" is not allowed. Accepted: images (jpg, png, webp), videos (mp4, webm), documents (pdf, doc, docx).`
    );
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  cb(null, true);
};

// Create multer instance — max 50MB per file (video limit)
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

module.exports = {
  upload,
  UPLOAD_DIR,
  ALLOWED_TYPES,
  MAX_SIZES,
  getFileType,
  isAllowedType,
};
