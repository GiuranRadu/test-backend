const express = require('express');
const router = express.Router();
const multer = require('multer');

const storage = require('../Utils/cloudinaryConfig');

const upload = multer({ storage: storage }).array('carImage');

router.route('/').post(upload, (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      status: 'failed',
      message: 'Please upload at least one image.'
    });
  }

  const imageUrls = req.files.map(file => file.path);

  res.json({
    status: 'success',
    message: 'Images uploaded successfully.',
    imageUrls
  });
});

module.exports = router;
