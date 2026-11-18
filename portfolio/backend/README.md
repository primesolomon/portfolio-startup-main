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
7. Run `npm run dev` to start both the API (port 3000) and frontend (port 8765). Open `http://127.0.0.1:8765`; `/health` on port 3000 is the liveness check and `/ready` checks database readiness. `npm start` starts only the API.

## Runtime configuration

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: MySQL connection. Set `DB_SSL=true` to require TLS 1.2 or newer and verify the database certificate; production startup requires this setting.
- `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS`: signed admin tokens; lifetime defaults to 3600 seconds.
- `CORS_ORIGINS`: comma-separated allowed browser origins.
- `TRUST_PROXY`: number of trusted reverse-proxy hops from `0` to `5`; keep `0` unless the hosting platform documents a proxy in front of Node. Set the exact hop count when needed so client IPs and rate limits work correctly.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: required for new product image uploads. Keep the API secret on the backend only. `CLOUDINARY_UPLOAD_FOLDER` optionally sets the Cloudinary folder; it defaults to `portfolio/product-covers`.
- `UPLOAD_DIR`: local directory for serving previously uploaded covers. New uploads go to Cloudinary and their secure URLs are stored in the product records. Keep any existing local cover files available until their records are updated.
- `FRONTEND_PORT`: local frontend server port; defaults to `8765`.
- `CONTACT_RECIPIENT_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`: SMTP relay settings. Until all are configured, contact submissions return `503 DELIVERY_UNAVAILABLE`; delivery failures return `502 DELIVERY_FAILED`.

The API will not report a contact message as sent until the SMTP relay accepts it. Image uploads are checked against their declared type and file signature, limited to 4 MiB, and streamed to Cloudinary. If Cloudinary is not configured, uploads return `503 UPLOAD_UNAVAILABLE`; provider failures return `502 UPLOAD_FAILED`.

## Production deployment

The app is not tied to a hosting provider. Deploy the frontend as a static site and the API as a Node.js service, preferably behind HTTPS. The frontend defaults to `/api` for a same-origin deployment; for separate frontend and API hosts, add `data-api-base-url="https://your-api-host/api"` to the frontend `<html>` element. Set `CORS_ORIGINS` to the exact HTTPS frontend origin(s).

Use the production database, Cloudinary account, strong unique JWT secret, and private admin credentials as host-managed environment secrets. Set `NODE_ENV=production`; the API rejects startup when required production settings are absent or invalid. SMTP may remain unconfigured while contact delivery is deferred; in that state contact submissions return `503 DELIVERY_UNAVAILABLE`. If any SMTP setting is provided, configure all SMTP settings and the recipient address. Run `npm ci` at build time, `npm run db:migrate` as a controlled release step, and `npm start` to serve the API. Do not run demo seeding in production. Provision admins using the deployment platform's private one-off job or environment, then remove the seed passwords from that job's environment.

The API adds security headers and in-process rate limits (10 login attempts, 5 contact submissions, and 20 uploads per IP per 15 minutes). If running multiple API instances, also configure rate limiting at the hosting platform or a shared store; the built-in limiter is per instance. The default Helmet content-security-policy is disabled to allow configured API and Cloudinary image hosts; configure a restrictive CSP at the production edge once the final frontend/API domains are known. Enable automated database backups and test a restore before launch. GitHub Actions runs the unit suite and dependency audit on backend changes. The production database and provider credentials cannot be verified from local development.

## Tests

`npm test` runs the API, validation, and upload unit tests without requiring MySQL or SMTP. `npm run test:integration` additionally runs the contract flow against the configured database. The integration test creates a uniquely named temporary admin and product and removes both afterward.
