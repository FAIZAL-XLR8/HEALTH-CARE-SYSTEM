const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFromBuffer = (fileBuffer, originalName, folder = 'telemedicine_verification_docs') => {
  return new Promise((resolve, reject) => {
    const cleanName = originalName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const options = {
      folder: folder,
      resource_type: 'auto',
      public_id: `${cleanName}_${Date.now()}`,
    };

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        console.error('Cloudinary stream upload error:', error);
        return reject(error);
      }
      resolve(result);
    });

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

module.exports = {
  cloudinary,
  uploadFromBuffer
};
