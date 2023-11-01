const {validationResult} = require('express-validator');
const {unlink} = require('fs').promises;
const path = require('path');

function validate(validations) {
  return async (req, res, next) => {
    try {
      for (const validation of validations) {
        await validation.run(req);
      }

      const result = validationResult(req);
      if (!result.isEmpty()) {
        if (req.file) {
          await unlink(path.resolve(__dirname,
            '../../react-app/public/upload', req.file.filename));
        }

        result.errors.forEach((error) => delete error.value);
        return res.status(400).json(result.errors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {validate};
