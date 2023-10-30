const multer = require('multer');
const path = require('path');
const User = require('../users/models/User');
const MediaTypeError = require('../errors/MediaTypeError');

const allowedExtensions = ['png', 'jpg', 'jpeg'];
function checkFileExtension(file, callback) {
  const extension = path.extname(file.originalname);
  const isValidExtension = allowedExtensions.indexOf(
    extension.substring(1).toLowerCase()) !== -1;

  const isValidMimeType = file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg';

  if (isValidExtension && isValidMimeType) {
    callback(null, true);
  } else {
    callback(
      new MediaTypeError(`A extensão ${extension} não é válida!`), false);
  }
}

const storage = (method) => {
  return multer.diskStorage({
    destination: (req, file, callback) => {
      const uploadFolder =
        path.resolve(__dirname, '../../react-app/public/upload');
      callback(null, uploadFolder);
    },
    filename: async (req, file, callback) => {
      const extension = path.extname(file.originalname);
      let filename = Date.now() + extension;

      if (method === 'userUpdate') {
        if (req.user && req.user.image !== 'default-user-icon.jpg') {
          filename = req.user.image;
        }
      } else if (method === 'adminUpdate') {
        const user = await User.findByPk(req.params.id);
        if (user && user.image !== 'default-user-icon.jpg') {
          filename = user.image;
        }
      }

      callback(null, filename);
    },
  });
};

const oneMB = 1*1000*1000;

function upload(method) {
  return multer({
    storage: storage(method),
    limits: {fileSize: oneMB},
    fileFilter: (req, file, callback) => {
      checkFileExtension(file, callback);
    },
  }).single('image');
}

module.exports = {upload};
