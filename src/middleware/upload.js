const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImages = /jpeg|jpg|png|gif|webp/;
  const allowedVideos = /mp4|mov|avi|mkv/;
  const allowedAudio = /mp3|wav|ogg|m4a/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

  if (file.fieldname === 'avatar' || file.fieldname === 'cover' || file.fieldname === 'image') {
    if (allowedImages.test(ext)) return cb(null, true);
  }
  if (file.fieldname === 'video' && allowedVideos.test(ext)) return cb(null, true);
  if (file.fieldname === 'audio' && allowedAudio.test(ext)) return cb(null, true);

  cb(new Error(`Invalid file type: ${ext}`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 10,
  },
});

module.exports = upload;
