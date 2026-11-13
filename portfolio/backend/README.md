# Portfolio backend

The Express API implements the routes in [`docs/api-contract.md`](./docs/api-contract.md). The vanilla frontend calls this API; it no longer treats browser storage as the source of portfolio content.

## Local setup

1. Install Node.js 20 or newer and MySQL 8 or compatible.
2. Create the database named by `DB_NAME` (the example uses `portfolio_db`) and a user with privileges to create and alter tables.
3. Copy `.env.example` to `.env`, then set the database connection, a random `JWT_SECRET` of at least 32 characters, and `CORS_ORIGINS`. Add the Cloudinary credentials to enable product image uploads. Never commit `.env`.
4. From this directory run:

   ```text
   npm ci
   npm run db:migrate
   ```

5. To initialize the preview text and founder cards in an empty database, optionally run `npm run db:seed-demo`. This inserts placeholder content only where it is missing; replace it before launch. Product records are intentionally not seeded.
6. Provision both admins privately. Set `ADMIN_1_NAME`, `ADMIN_1_EMAIL`, `ADMIN_1_PASSWORD`, and the corresponding `ADMIN_2_*` variables in the process environment, then run `npm run db:seed-admins`. Passwords must be at least 12 characters and no more than 72 UTF-8 bytes. The command stores bcrypt hashes and does not print passwords.
7. Run `npm run dev` to start both the API (port 3000) and frontend (port 8765). Open `http://127.0.0.1:8765`; `/health` on port 3000 is available for an API liveness check. `npm start` starts only the API.

## Runtime configuration

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: MySQL connection.
- `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS`: signed admin tokens; lifetime defaults to 3600 seconds.
- `CORS_ORIGINS`: comma-separated allowed browser origins.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: required for new product image uploads. Keep the API secret on the backend only. `CLOUDINARY_UPLOAD_FOLDER` optionally sets the Cloudinary folder; it defaults to `portfolio/product-covers`.
- `UPLOAD_DIR`: local directory for serving previously uploaded covers. New uploads go to Cloudinary and their secure URLs are stored in the product records. Keep any existing local cover files available until their records are updated.
- `FRONTEND_PORT`: local frontend server port; defaults to `8765`.
- `CONTACT_RECIPIENT_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`: SMTP relay settings. Until all are configured, contact submissions return `503 DELIVERY_UNAVAILABLE`; delivery failures return `502 DELIVERY_FAILED`.

The API will not report a contact message as sent until the SMTP relay accepts it. Image uploads are checked against their declared type and file signature, limited to 4 MiB, and streamed to Cloudinary. If Cloudinary is not configured, uploads return `503 UPLOAD_UNAVAILABLE`; provider failures return `502 UPLOAD_FAILED`.

## Tests

`npm test` runs the API, validation, and upload unit tests without requiring MySQL or SMTP. `npm run test:integration` additionally runs the contract flow against the configured database. The integration test creates a uniquely named temporary admin and product and removes both afterward.
