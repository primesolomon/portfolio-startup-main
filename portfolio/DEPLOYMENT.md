# Free demo deployment

This guide deploys the static frontend to Cloudflare Pages, the API to Render Free, and MySQL-compatible data to TiDB Cloud Starter. This is a public demo setup, **not a production-reliability setup**:

- Render explicitly says Free web services should not be used for production. A service spins down after 15 minutes without traffic and can take about a minute to wake; its local filesystem is ephemeral.
- TiDB Starter's free MySQL-compatible quota is 5 GiB row storage, 5 GiB columnar storage, and 50 million request units per month per eligible instance. At quota, new connections can be denied and existing connections throttled.
- TiDB Starter requires TLS. The application enforces TLS in production.
- Do not use this stack for confidential or regulated data. PingCAP has disclosed a recent incident involving unauthorized access to internal systems and some customer/account records; it said there was no evidence that data stored in TiDB databases was affected, while its customer impact assessment was ongoing. Reassess the provider's current incident status before storing anything sensitive.

For a real production launch, use an always-on API service and a database plan with suitable availability, access controls, backups, and tested restore procedures.

## 1. Push the deployment branch

Commit and push the reviewed project changes to the GitHub repository that will be connected to Cloudflare and Render. Never commit `.env` files or provider credentials. This repository's deployment template is [`render.yaml`](../render.yaml).

## 2. Create the TiDB database

1. Create a **MySQL-compatible TiDB Cloud Starter** instance in a region near the Render service.
2. Create or select the application database, then use TiDB's **Connect** dialog to copy the host, port, and exact generated username. Starter commonly uses port `4000`; use the values shown for your instance. Starter usernames include the instance prefix.
3. Generate and save the database password in a password manager. Do not send it in chat or commit it.
4. Configure the public endpoint's IP access list. Render uses shared outbound IP ranges for services in a region, not one fixed address by default. After creating the Render service, find its outbound ranges in Render's **Connect > Outbound** panel and allow the relevant ranges in TiDB. Avoid opening database access to all IPs.

## 3. Deploy the frontend to Cloudflare Pages

1. In Cloudflare, create a **Pages** project and connect the GitHub repository and deployment branch.
2. Choose no framework preset. Set the root directory to `portfolio/frontend/vanilla`, leave the build command empty, and set the output directory to `.`.
3. Deploy. Save the production URL, such as `https://your-project.pages.dev`.
4. Do not add a `404.html`; Pages will serve the SPA entry point for client-side routes.

## 4. Deploy the API to Render

1. In Render, create a **Blueprint** from the same GitHub repository and branch. Render will read the root-level `render.yaml`.
2. Choose a region near the TiDB instance. Supply the `sync: false` variables when prompted, using the TiDB connection details, Cloudinary credentials, and the exact Cloudflare Pages origin (`https://your-project.pages.dev`) for `CORS_ORIGINS`.
3. Generate `JWT_SECRET` locally, for example with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`, then enter the result directly into Render. Do not reuse a local or example secret.
4. Confirm `NODE_ENV=production`, `TRUST_PROXY=1`, and `DB_SSL=true`. Do not add SMTP variables; contact delivery is intentionally disabled.
5. Wait for the service to deploy and note its `https://...onrender.com` URL. Check `https://YOUR-API.onrender.com/health`.
6. In TiDB's IP access list, allow the Render service's outbound IP ranges for its selected region. Do not use `0.0.0.0/0` as a shortcut.

## 5. Migrate and seed the database

Run these commands from `portfolio/backend` on a trusted local machine after creating a local `.env` containing the TiDB host, port, database name, exact username, password, and `DB_SSL=true`. Keep the `.env` ignored by Git. Add your local IP temporarily to the TiDB allowlist if needed, then remove it when finished.

```powershell
npm ci
npm run db:migrate
npm run db:seed-demo
```

Replace the placeholder demo content with real public content before sharing the site. To provision both admins, add `ADMIN_1_NAME`, `ADMIN_1_EMAIL`, `ADMIN_1_PASSWORD`, and `ADMIN_2_NAME`, `ADMIN_2_EMAIL`, `ADMIN_2_PASSWORD` to the local `.env`, then run:

```powershell
npm run db:seed-admins
```

Use unique passwords of at least 12 characters. Remove the `ADMIN_*` values from the local `.env` afterward. Do not add admin credentials to Render's running service.

## 6. Point the frontend to the API

Once Render gives you the API URL, edit the `<html>` element in `portfolio/frontend/vanilla/index.html` to include:

```html
data-api-base-url="https://YOUR-API.onrender.com/api"
```

Commit and push that change so Cloudflare Pages redeploys. The API CORS origin must remain the exact Pages production origin, with no path or trailing slash. Avoid using preview deployments for admin access.

## 7. Smoke-test the public demo

- `https://YOUR-API.onrender.com/health` returns `200`.
- `https://YOUR-API.onrender.com/ready` returns `200` after database migrations succeed.
- `https://YOUR-API.onrender.com/api/site-content` and `/api/products` return the expected JSON data envelope.
- Open the Pages URL, check the home/products/about/contact pages, and sign in at `/index.html#/admin/signin`.
- Verify an image upload reaches Cloudinary. Render's local filesystem is ephemeral, so it must not be used as durable upload storage.
- A contact submission should report that delivery is unavailable until SMTP is configured; do not present it as sent.

Monitor the Render and TiDB usage dashboards. Render Free can sleep and has monthly usage limits; TiDB Starter can deny connections or throttle work when free quotas are reached. Do not interpret a successful smoke test as a production availability or backup guarantee.

## Provider documentation

- [Render Free services and limitations](https://render.com/docs/free)
- [Render outbound IP ranges](https://render.com/docs/outbound-ip-addresses)
- [Render Blueprint specification](https://render.com/docs/blueprint-spec)
- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)
- [Cloudflare Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [TiDB Cloud Starter plan and quotas](https://docs.pingcap.com/tidbcloud/select-cluster-tier/)
- [TiDB Cloud Starter TLS requirements](https://docs.pingcap.com/tidbcloud/secure-connections-to-serverless-clusters/)
