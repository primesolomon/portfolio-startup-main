const { randomUUID } = require('node:crypto');
const path = require('node:path');
const { Readable } = require('node:stream');
const cloudinary = require('cloudinary').v2;
const HttpError = require('../../utils/http-error');

const imageTypes = {
  'image/jpeg': (buffer) => buffer.length >= 3
    && buffer[0] === 0xff
    && buffer[1] === 0xd8
    && buffer[2] === 0xff,
  'image/png': (buffer) => buffer.length >= 8
    && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  'image/webp': (buffer) => buffer.length >= 12
    && buffer.toString('ascii', 0, 4) === 'RIFF'
    && buffer.toString('ascii', 8, 12) === 'WEBP',
};

function getUploadDir() {
  return path.resolve(
    process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads/product-covers')
  );
}

function getCloudinaryConfig() {
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  };
  if (Object.values(config).some((value) => !value)) {
    throw new HttpError(
      503,
      'UPLOAD_UNAVAILABLE',
      'Cloud image storage is not configured.'
    );
  }
  return config;
}

function uploadBuffer(client, buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.once('error', reject);
    Readable.from([buffer]).pipe(stream);
  });
}

function createUploadService({ client = cloudinary, logger = console } = {}) {
  return {
    async store(file) {
      if (!file || !Buffer.isBuffer(file.buffer)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'A file is required.');
      }

      const matchesImage = imageTypes[file.mimetype];
      if (!matchesImage || !matchesImage(file.buffer)) {
        throw new HttpError(
          415,
          'UNSUPPORTED_MEDIA_TYPE',
          'Upload a JPEG, PNG, or WebP image with matching file content.'
        );
      }

      const config = getCloudinaryConfig();
      const folder = process.env.CLOUDINARY_UPLOAD_FOLDER?.trim()
        || 'portfolio/product-covers';

      try {
        client.config({ ...config, secure: true });
        const result = await uploadBuffer(client, file.buffer, {
          folder,
          public_id: randomUUID(),
          resource_type: 'image',
          overwrite: false,
          unique_filename: false,
        });
        if (typeof result?.secure_url !== 'string' || !result.secure_url.startsWith('https://')) {
          throw new HttpError(
            502,
            'UPLOAD_FAILED',
            'Cloud image storage returned an invalid image URL.'
          );
        }
        return { url: result.secure_url };
      } catch (error) {
        if (error instanceof HttpError) throw error;
        const httpCode = Number.isInteger(error?.http_code) ? error.http_code : null;
        logger.error('Cloudinary product image upload failed.', { httpCode });
        throw new HttpError(
          502,
          'UPLOAD_FAILED',
          'Cloud image storage could not accept the image.'
        );
      }
    },
  };
}

module.exports = {
  ...createUploadService(),
  createUploadService,
  getUploadDir,
};
