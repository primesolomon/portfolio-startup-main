const test = require('node:test');
const assert = require('node:assert/strict');
const { Writable } = require('node:stream');
const { createUploadService } = require('../src/modules/uploads/uploads.service');

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]);
const credentialNames = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

function setCloudinaryEnvironment() {
  const previous = Object.fromEntries(
    credentialNames.map((name) => [name, process.env[name]])
  );
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-key';
  process.env.CLOUDINARY_API_SECRET = 'test-secret';
  return () => {
    for (const name of credentialNames) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  };
}

function createMockClient({ result, failure } = {}) {
  const calls = {};
  const client = {
    config(config) {
      calls.config = config;
    },
    uploader: {
      upload_stream(options, callback) {
        calls.options = options;
        const chunks = [];
        const stream = new Writable({
          write(chunk, encoding, done) {
            chunks.push(Buffer.from(chunk));
            done();
          },
        });
        stream.once('finish', () => {
          calls.buffer = Buffer.concat(chunks);
          callback(failure || null, result);
        });
        return stream;
      },
    },
  };
  return { client, calls };
}

test('uploads validated image buffers to Cloudinary and returns its secure URL', async () => {
  const restoreEnvironment = setCloudinaryEnvironment();
  const previousFolder = process.env.CLOUDINARY_UPLOAD_FOLDER;
  process.env.CLOUDINARY_UPLOAD_FOLDER = 'test/product-covers';
  const { client, calls } = createMockClient({
    result: { secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/example.png' },
  });

  try {
    const service = createUploadService({ client });
    const result = await service.store({ mimetype: 'image/png', buffer: png });

    assert.equal(result.url, 'https://res.cloudinary.com/test-cloud/image/upload/example.png');
    assert.deepEqual(calls.config, {
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
      secure: true,
    });
    assert.deepEqual(calls.options, {
      folder: 'test/product-covers',
      public_id: calls.options.public_id,
      resource_type: 'image',
      overwrite: false,
      unique_filename: false,
    });
    assert.match(calls.options.public_id, /^[0-9a-f-]{36}$/);
    assert.deepEqual(calls.buffer, png);
  } finally {
    restoreEnvironment();
    if (previousFolder === undefined) delete process.env.CLOUDINARY_UPLOAD_FOLDER;
    else process.env.CLOUDINARY_UPLOAD_FOLDER = previousFolder;
  }
});

test('uploads fail clearly when Cloudinary credentials are missing', async () => {
  const previous = Object.fromEntries(
    credentialNames.map((name) => [name, process.env[name]])
  );
  for (const name of credentialNames) delete process.env[name];
  const { client, calls } = createMockClient();

  try {
    await assert.rejects(
      createUploadService({ client }).store({ mimetype: 'image/png', buffer: png }),
      (error) => error.status === 503 && error.code === 'UPLOAD_UNAVAILABLE'
    );
    assert.equal(calls.options, undefined);
  } finally {
    for (const name of credentialNames) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});

test('rejects mismatched image data before sending it to Cloudinary', async () => {
  const restoreEnvironment = setCloudinaryEnvironment();
  const { client, calls } = createMockClient();

  try {
    await assert.rejects(
      createUploadService({ client }).store({
        mimetype: 'image/png',
        buffer: Buffer.from('not an image'),
      }),
      (error) => error.status === 415 && error.code === 'UNSUPPORTED_MEDIA_TYPE'
    );
    assert.equal(calls.options, undefined);
  } finally {
    restoreEnvironment();
  }
});

test('reports Cloudinary upload failures without exposing provider details', async () => {
  const restoreEnvironment = setCloudinaryEnvironment();
  const providerError = Object.assign(new Error('private provider response'), { http_code: 401 });
  const { client } = createMockClient({ failure: providerError });
  const log = [];

  try {
    await assert.rejects(
      createUploadService({
        client,
        logger: { error: (...args) => log.push(args) },
      }).store({ mimetype: 'image/png', buffer: png }),
      (error) => error.status === 502
        && error.code === 'UPLOAD_FAILED'
        && !error.message.includes('private provider response')
    );
    assert.deepEqual(log, [
      ['Cloudinary product image upload failed.', { httpCode: 401 }],
    ]);
  } finally {
    restoreEnvironment();
  }
});
