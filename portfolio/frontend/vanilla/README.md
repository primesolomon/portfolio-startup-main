# Vanilla portfolio preview

The vanilla app uses browser ES modules and keeps its existing `index.html` entry point.

- `app.js` starts rendering and loads the event handlers.
- `js/core.js` owns shared state, routing helpers, escaping, and local storage.
- `js/components.js` contains shared markup helpers and site layout.
- `js/pages/public.js` and `js/pages/admin.js` render their respective page templates.
- `js/services/data.js` calls the Express API and preserves the field names and product status workflow from the backend API contract.
- `js/render.js` resolves routes and renders pages; `js/events.js` handles user interactions.
- `styles.css` imports `styles/base.css`, `styles/public.css`, `styles/admin.css`, and `styles/responsive.css` in cascade order.

## Backend integration

The app loads public content and products from the backend and uses bearer-token authentication for admin operations. The token is stored in this browser's local storage and discarded on sign-out or expiration. Admin accounts must be provisioned by the backend; there is no public registration.

Run `npm run dev` from `../../backend` to start both the API and frontend. Open `http://127.0.0.1:8765`; the API listens on port 3000. The default API base is `http://localhost:3000/api`, set on the `<html data-api-base-url>` attribute in `index.html`. Do not open the page with `file://`; the browser's opaque file origin is not allowed by default.

Product image files upload to the backend when the product is saved; the backend validates them, sends them to Cloudinary, and saves the returned secure URL with the product. Contact submissions report success only after the configured SMTP relay accepts the message; if SMTP is not configured, the backend returns an explicit unavailable error and the form retains the visitor's message.

The product, founder, and site-content objects returned by the API use the camelCase fields in `../../backend/docs/api-contract.md`. Public product routes use slugs, admin product routes use IDs, creating a product starts it as a draft, and publication changes are separate from content updates. Hard delete and admin message inbox controls are intentionally not included because they are not in the MVP contract.
