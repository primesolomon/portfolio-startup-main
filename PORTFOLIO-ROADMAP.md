# Portfolio Startup Roadmap

## The idea

Build a full-stack portfolio for you and Solomon to showcase your team and the products or projects you create. Visitors can browse published content. You can sign in to a private admin dashboard to add, edit, publish, and archive content without changing application code.

The dashboard should manage **content**, while page layouts and visual design remain in code for the first version. A drag-and-drop page builder can be considered later if you truly need to create arbitrary page layouts from the dashboard.

## Before implementation

Agree on the following together:

1. **Purpose and audience**
   - Are you showcasing the startup, yourselves as founders, your products, or all three?
   - Who do you expect to visit the site: customers, partners, or potential investors?
2. **First-version content**
   - Product/project name, short summary, description, cover image, category, links, featured status, and publication status.
   - Decide whether About, Contact, and landing-page text also need to be editable.
3. **Admin access**
   - Start with individual accounts for both founders.
   - Decide whether both accounts can manage all content or whether roles are needed.
4. **Pages and design**
   - Sketch the public pages and admin screens.
   - Agree on branding, colors, navigation, and mobile behavior.
5. **Scope**
   - Keep the initial version small: public portfolio, product details, admin sign-in, and product create/edit/publish/archive.
6. **Team workflow**
   - Choose a stack you can both support, decide how to split tasks, and agree on how code changes will be reviewed and tested.

## Suggested MVP pages and workflows

### Public site

- **Home:** introduction, featured products, and clear links to explore more or contact you.
- **Products:** list of published products/projects, optionally filterable by category.
- **Product detail:** description, images, and relevant external links.
- **About:** who you are and what the startup is building.
- **Contact:** a way to reach you, such as an email link or a contact form.

### Admin dashboard

- **Sign in / sign out**
- **Products list:** see, search, and manage existing entries.
- **Create / edit product:** enter content and upload or select a cover image.
- **Publish controls:** save a draft, publish, unpublish, or archive an item.

The backend must enforce authentication and authorization on admin operations. Hiding admin controls in the browser is not security; the API must reject unauthorized requests too.

## Recommended implementation sequence

1. Write down the MVP scope, product fields, and page sketches.
2. Choose the stack and repository layout.
3. Define the database models and API contract.
4. Implement database migrations and backend endpoints; test them.
5. Build the public pages using published content from the API.
6. Add admin authentication and protected content-management screens.
7. Test validation, permissions, image uploads, and responsive layouts.
8. Deploy the site, API, and database; configure production secrets, HTTPS, and backups.

## Project structure for your chosen stack

This layout keeps Solomon's frontend work separate from your Express/MySQL backend work, while keeping both in one repository. The frontend calls the backend over HTTP; it must never connect directly to MySQL.

```text
portfolio/
├── frontend/                         # Solomon: HTML, CSS, and browser JavaScript
│   ├── pages/
│   │   ├── index.html                # Public home page
│   │   ├── products.html             # Public product listing
│   │   ├── product.html              # Product detail page
│   │   ├── about.html
│   │   ├── contact.html
│   │   └── admin/
│   │       ├── login.html
│   │       └── dashboard.html        # Manage products
│   ├── css/
│   │   ├── base.css                  # Reset, typography, shared styles
│   │   ├── layout.css                # Navigation, page layout, responsive rules
│   │   ├── components.css            # Buttons, cards, forms, alerts
│   │   └── admin.css                 # Dashboard-specific styles
│   ├── js/
│   │   ├── api.js                    # Fetch helpers for backend endpoints
│   │   ├── products.js               # Public product listing/detail behavior
│   │   ├── admin-login.js
│   │   └── admin-products.js         # Dashboard product form/list behavior
│   └── assets/
│       ├── images/
│       └── icons/
├── backend/                          # You: Express API and MySQL
│   ├── src/
│   │   ├── app.js                    # Express app and middleware setup
│   │   ├── server.js                 # Start listening for requests
│   │   ├── config/
│   │   │   └── database.js           # MySQL connection pool
│   │   ├── middleware/
│   │   │   ├── authenticate.js       # Protect admin endpoints
│   │   │   └── validate.js           # Validate request data
│   │   ├── modules/
│   │   │   ├── products/
│   │   │   │   ├── products.routes.js
│   │   │   │   ├── products.controller.js
│   │   │   │   ├── products.service.js
│   │   │   │   └── products.repository.js
│   │   │   └── auth/
│   │   │       ├── auth.routes.js
│   │   │       ├── auth.controller.js
│   │   │       └── auth.service.js
│   │   └── utils/
│   │       └── http-errors.js
│   ├── database/
│   │   ├── schema.sql                # Initial tables
│   │   ├── migrations/               # Versioned database changes
│   │   └── seeds/                    # Optional development sample data
│   ├── tests/
│   ├── .env.example                  # Variable names only; no real secrets
│   └── package.json
├── docs/
│   └── api-contract.md               # Agreed endpoints and request/response shapes
├── .gitignore
└── README.md
```

### Who owns what

**Soloo (frontend):**

- Build the HTML pages and responsive CSS.
- Add browser JavaScript for rendering API data, submitting forms, and showing loading, empty, and error states.
- Use `frontend/js/api.js` to call the agreed API; do not put database credentials or backend-only secrets in frontend files.
- Build the admin screens, but treat the backend as the authority for whether an admin is signed in and allowed to make changes.

**You (backend):**

- Design the MySQL schema and migrations.
- Build and test the Express API, including input validation, authentication, and authorization.
- Keep SQL/database access in the backend; use parameterized queries.
- Return consistent JSON and HTTP status codes as specified in the API contract.
- Store database credentials in backend environment variables, never in frontend code or Git.

**Agree together:**

- Define the API contract before building against it. For example, document `GET /api/products` and `POST /api/admin/products`, including example JSON and error responses.
- Agree on field names, status values, and how the frontend gets the API base URL.
- Review changes that cross the boundary. If the API response needs to change, update the contract and tell the other person before changing it.

At first, keep `frontend/` and `backend/` as separate folders. You can run them separately during development. Later, Express can serve the built/static frontend from the same origin if that suits your deployment; this does not change the ownership split.

## Stack

- **Frontend:** HTML, CSS, and browser JavaScript (no framework required).
- **Backend:** Node.js and Express.
- **Database:** MySQL.
- **Database access:** MySQL driver's connection pool and parameterized queries; keep queries in backend repository modules.
- **Images:** For an MVP, use externally hosted image URLs or add a dedicated upload/storage solution later. Do not store image files directly in MySQL.

## Initial product data checklist

A product/project record might include:

- `id`
- `title`
- `slug` (a URL-friendly unique identifier)
- `summary`
- `description`
- `coverImageUrl`
- `category`
- `projectUrl` (optional)
- `repositoryUrl` (optional)
- `featured`
- `status` (`draft`, `published`, or `archived`)
- `createdAt`
- `updatedAt`

Agree on required fields and whether you need additional fields before designing the database. Keep API field names consistent with the chosen database/API conventions, and document the mapping in `docs/api-contract.md`.

## Completion checklist for the MVP

- Visitors can browse published products without signing in.
- Admins can sign in and manage product content through the dashboard.
- Draft and archived products do not appear in the public listing.
- The backend protects every admin-only operation.
- Forms validate required fields and report errors clearly.
- The site works on mobile and desktop.
- Secrets are kept out of source control and production data is backed up.
