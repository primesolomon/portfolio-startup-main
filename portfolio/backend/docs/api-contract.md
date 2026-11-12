# Portfolio CMS API Contract

**Status:** MVP draft; endpoints described here are not implemented yet.

This document defines the proposed agreement between the portfolio frontend and the Express backend. It follows the MVP in [ProjectRequirement.md](./ProjectRequirement.md). Items marked **TBD** need a decision before the related endpoint is implemented.

## 1. Conventions

- API paths are relative to the backend host and start with `/api`.
- JSON requests use `Content-Type: application/json` and JSON responses use `application/json`, except image uploads.
- Successful JSON responses use a `{ "data": ... }` envelope.
- Dates use ISO 8601 UTC strings.
- IDs are integers in this draft; confirm against the final database schema.
- Product status values are `draft`, `published`, and `archived`.
- There is no public admin-account registration endpoint. The two founder accounts are provisioned through a private setup/seed process.

## 2. Authentication

Admin endpoints require a valid access token in the header:

```http
Authorization: Bearer <accessToken>
```

The login endpoint returns a bearer token. The frontend signs out by discarding its token. Token lifetime and whether server-side token revocation is needed are **TBD**. Both founders have the same permissions in the MVP.

### `POST /api/auth/login`

Authenticate an admin.

Request:

```json
{
  "email": "founder@example.com",
  "password": "example-password"
}
```

Success `200`:

```json
{
  "data": {
    "accessToken": "<token>",
    "tokenType": "Bearer",
    "expiresInSeconds": 3600,
    "admin": {
      "id": 1,
      "name": "Founder Name",
      "email": "founder@example.com"
    }
  }
}
```

Invalid credentials return `401` with error code `INVALID_CREDENTIALS`. The response must not reveal whether the email address or password was incorrect.

### `GET /api/auth/me`

Return the authenticated admin profile. Requires a bearer token.

Success `200`:

```json
{
  "data": {
    "id": 1,
    "name": "Founder Name",
    "email": "founder@example.com"
  }
}
```

## 3. Public content

### `GET /api/site-content`

Return the public startup, founder, About, and Contact content.

Success `200`:

```json
{
  "data": {
    "startup": {
      "name": "Example Startup",
      "tagline": "A short introduction",
      "description": "A public overview of the startup."
    },
    "founders": [
      {
        "id": 1,
        "name": "Founder Name",
        "role": "Co-founder",
        "biography": "A public founder biography.",
        "imageUrl": "https://cdn.example.com/founder.jpg",
        "displayOrder": 1
      }
    ],
    "about": {
      "heading": "About us",
      "body": "Public About section content."
    },
    "contact": {
      "heading": "Contact",
      "body": "Public Contact section content.",
      "email": "hello@example.com",
      "phone": null
    }
  }
}
```

The fields shown are a proposed starting shape; exact startup, founder, About, and Contact fields are **TBD**. This response must not expose the private email-delivery configuration used by the Contact form.

### `POST /api/contact-messages`

Submit a visitor message. The backend sends it to the configured startup email address. The MVP does not store messages for an admin inbox.

Proposed request:

```json
{
  "name": "Visitor Name",
  "email": "visitor@example.com",
  "message": "I would like to learn more."
}
```

Success `202`:

```json
{
  "data": {
    "accepted": true,
    "message": "Your message has been sent."
  }
}
```

Contact form fields, validation rules, mail delivery provider, and behavior when delivery fails are **TBD**. The API must validate input and must not report success if it cannot hand off the message for delivery.

## 4. Public products/projects

### `GET /api/products`

Return published products/projects only. Draft and archived records must not be included.

Optional query parameters:

- `category` — filter by category.
- `featured` — `true` or `false`.

Success `200`:

```json
{
  "data": [
    {
      "id": 42,
      "title": "Example Product",
      "slug": "example-product",
      "summary": "A short product summary.",
      "description": "The full public product description.",
      "coverImageUrl": "https://cdn.example.com/example-product.jpg",
      "category": "Tools",
      "projectUrl": "https://example.com",
      "repositoryUrl": null,
      "featured": true,
      "createdAt": "2026-01-15T12:00:00.000Z",
      "updatedAt": "2026-01-16T12:00:00.000Z"
    }
  ]
}
```

### `GET /api/products/:slug`

Return one published product/project by slug. Return `404 NOT_FOUND` when it does not exist or is not published.

Success `200` returns the same product object shape as an item in `GET /api/products`.

Pagination is not included in the initial contract; revisit if the product list needs it.

## 5. Admin CMS content

All endpoints in this section require an authenticated admin bearer token.

### `PATCH /api/admin/site-content`

Update startup, founder, About, and/or Contact content. Send only the sections being changed; omitted sections remain unchanged. Changes are published immediately when saved.

Example request:

```json
{
  "about": {
    "heading": "About our team",
    "body": "Updated public About content."
  }
}
```

Success `200` returns the updated public content in the same shape as `GET /api/site-content`.

The exact editable fields and whether founder entries are updated by ID or replaced as a collection are **TBD**.

## 6. Admin products/projects

All endpoints in this section require an authenticated admin bearer token.

### `GET /api/admin/products`

List products/projects across all statuses. Optional query parameter `status` filters by `draft`, `published`, or `archived`. If omitted, return all statuses.

Success `200` returns an array of product objects, including the `status` field.

### `POST /api/admin/products`

Create a product/project. New entries start as `draft`; publishing is a separate action.

Proposed request:

```json
{
  "title": "Example Product",
  "slug": "example-product",
  "summary": "A short product summary.",
  "description": "The full product description.",
  "coverImageUrl": "https://cdn.example.com/example-product.jpg",
  "category": "Tools",
  "projectUrl": "https://example.com",
  "repositoryUrl": null,
  "featured": false
}
```

Success `201` returns the created product object, including its `id`, `status`, `createdAt`, and `updatedAt`.

### `GET /api/admin/products/:id`

Return a single product/project of any status. Success `200` returns the admin product object. Missing records return `404 NOT_FOUND`.

### `PATCH /api/admin/products/:id`

Update product content without changing its publication status. The request accepts any editable product fields shown above. Success `200` returns the updated product object.

### `PATCH /api/admin/products/:id/status`

Change the product publication status.

Request:

```json
{
  "status": "published"
}
```

Allowed values are `draft`, `published`, and `archived`. Unpublishing means changing the status to `draft`. The backend must reject publishing when required content is missing or invalid; the required fields and exact transition rules are **TBD**.

Success `200` returns the updated product object.

There is no hard-delete endpoint in the MVP; archive a product instead.

## 7. Product cover image upload

### `POST /api/admin/uploads/product-cover`

Upload one product cover image. Requires an authenticated admin bearer token.

Request is `multipart/form-data` with one file field named `file`.

Success `201`:

```json
{
  "data": {
    "url": "https://cdn.example.com/uploads/example-product.jpg"
  }
}
```

The frontend uses the returned `url` as `coverImageUrl` when creating or updating the product. Storage provider, supported file types, maximum size, and image processing are **TBD**. Reject unsupported file types with `415 UNSUPPORTED_MEDIA_TYPE` and oversized files with `413 FILE_TOO_LARGE`.

## 8. Error format and status codes

Errors use a consistent JSON envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      {
        "field": "email",
        "message": "Enter a valid email address."
      }
    ]
  }
}
```

| HTTP status | Meaning | Example error code |
| --- | --- | --- |
| `400` | Invalid request or validation failure | `VALIDATION_ERROR` |
| `401` | Missing, invalid, or expired authentication | `UNAUTHENTICATED` |
| `401` | Invalid login credentials | `INVALID_CREDENTIALS` |
| `403` | Authenticated user is not allowed to perform the action | `FORBIDDEN` |
| `404` | Requested resource is unavailable | `NOT_FOUND` |
| `409` | Conflict, such as a duplicate slug | `CONFLICT` |
| `413` | Uploaded file exceeds the configured limit | `FILE_TOO_LARGE` |
| `415` | Unsupported upload media type | `UNSUPPORTED_MEDIA_TYPE` |
| `500` | Unexpected server failure | `INTERNAL_ERROR` |

Error responses must not expose stack traces, credentials, tokens, or private mail-provider details.

## 9. Decisions to confirm before implementation

- Exact required and optional product fields; slug generation and duplicate handling.
- Exact editable fields and update behavior for startup, founders, About, and Contact.
- Contact form fields, recipient address, delivery provider, and failure handling.
- Bearer-token lifetime and logout/session invalidation behavior.
- Product image storage provider, supported formats, size limits, and processing.
- Whether product listing needs pagination.

## 10. Related documents

- [Project requirements](./ProjectRequirement.md)
- [Project roadmap](../../../PORTFOLIO-ROADMAP.md)