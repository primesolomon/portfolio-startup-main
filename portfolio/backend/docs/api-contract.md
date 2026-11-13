# Portfolio CMS API Contract

**Status:** MVP agreement; implementation follows this contract.

This document defines the MVP agreement between the portfolio frontend and the Express backend. It follows the MVP in [ProjectRequirement.md](./ProjectRequirement.md).

## 1. Conventions

- API paths are relative to the backend host and start with `/api`.
- JSON requests use `Content-Type: application/json` and JSON responses use `application/json`, except image uploads.
- Successful JSON responses use a `{ "data": ... }` envelope.
- Dates use ISO 8601 UTC strings.
- Resource IDs are positive unsigned integers.
- Product status values are `draft`, `published`, and `archived`.
- Strings are trimmed before validation and persistence. Length limits below are Unicode character counts unless specified as bytes.
- There is no public admin-account registration endpoint. The two founder accounts are provisioned through a private setup/seed process.

## 2. Authentication

Admin endpoints require a valid access token in the header:

```http
Authorization: Bearer <accessToken>
```

The login endpoint returns a bearer token that expires after one hour. The MVP uses stateless JWTs with no refresh or revocation endpoint; signing out discards the token in the frontend. Both founders have the same permissions in the MVP.

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

The response fields are:

- `startup`: `name` (maximum 200 characters), `tagline` (maximum 500), and `description` (maximum 10,000).
- `founders`: ordered by `displayOrder`; each has `id`, `name` (maximum 150), `role` (maximum 150), nullable `biography` (maximum 5,000), nullable `imageUrl` (HTTP(S), maximum 2,048), and `displayOrder`.
- `about`: `heading` (maximum 200) and `body` (maximum 10,000).
- `contact`: `heading` (maximum 200), `body` (maximum 5,000), nullable `email` (valid email, maximum 254), and nullable `phone` (maximum 50).

Site content fields may be empty while being configured. Omitted sections in an admin update remain unchanged. This response must not expose the private email-delivery configuration used by the Contact form.

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

The request is trimmed and validated as follows: `name` is required (1–120 characters), `email` is required and valid (maximum 254 characters), and `message` is required (10–5,000 characters). Messages are not stored. Delivery uses a configured SMTP relay; the recipient and SMTP credentials are backend environment configuration, never public site content. Return `202` only after the relay accepts the message. Return `503 DELIVERY_UNAVAILABLE` if delivery is not configured and `502 DELIVERY_FAILED` if handoff fails. Do not return success on a delivery failure.

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
      "category": "Analytics",
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

Products use these validation rules:

- `title`: required, 3–200 characters.
- `slug`: required, 1–220 characters, lowercase ASCII letters/digits separated by single hyphens (`^[a-z0-9]+(?:-[a-z0-9]+)*$`). The frontend supplies it; the API does not generate it. Slugs are unique and may be changed when editing. A duplicate returns `409 CONFLICT`.
- `summary`: required, 1–500 characters.
- `description`: required, 1–10,000 characters.
- `category`: required and one of `Analytics`, `Project Management`, `Security`, `Developer Tools`, `Media`, or `General`, matching the admin selector.
- `coverImageUrl`, `projectUrl`, and `repositoryUrl`: nullable. Non-null values must be valid HTTP(S) URLs no longer than 2,048 characters.
- `featured`: boolean, default `false`.

The database generates integer IDs and UTC timestamps. The frontend’s admin form requires title, slug, summary, description, and category; an image and external links are optional.

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

To edit founders, submit the complete replacement array. Existing IDs are preserved; founder creation and deletion remain outside the MVP:

```json
{
  "founders": [
    {
      "id": 1,
      "name": "Founder Name",
      "role": "Co-founder",
      "biography": "Updated biography.",
      "imageUrl": null,
      "displayOrder": 1
    }
  ]
}
```

Success `200` returns the updated public content in the same shape as `GET /api/site-content`.

Editable fields are exactly those returned by `GET /api/site-content`. A `founders` update is a complete replacement array, matching the frontend’s founders editor; each entry must include its `id` and all fields. The replacement is atomic, preserves submitted IDs, and uses `displayOrder` for public ordering. Founder creation and deletion are not exposed in the MVP; founder records are provisioned through the private seed/setup process.

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
  "category": "Analytics",
  "projectUrl": "https://example.com",
  "repositoryUrl": null,
  "featured": false
}
```

Success `201` returns the created product object, including its `id`, `status`, `createdAt`, and `updatedAt`.

The create request uses the product validation rules in section 4. `status` is not accepted on create; a new record is always a draft.

### `GET /api/admin/products/:id`

Return a single product/project of any status. Success `200` returns the admin product object. Missing records return `404 NOT_FOUND`.

### `PATCH /api/admin/products/:id`

Update product content without changing its publication status. The request accepts any editable product fields shown in section 4, including `slug`, but not `status`. Success `200` returns the updated product object.

### `PATCH /api/admin/products/:id/status`

Change the product publication status.

Request:

```json
{
  "status": "published"
}
```

Allowed values are `draft`, `published`, and `archived`. Any transition between these values is allowed, including restoring an archived product to draft. Publishing is rejected with `400 VALIDATION_ERROR` unless all required product fields pass validation. Unpublishing means changing the status to `draft`.

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

The frontend uses the returned `url` as `coverImageUrl` when creating or updating the product. The backend validates the image and uploads it to the configured Cloudinary account; the returned HTTPS URL is stored with the product. Uploads use server-generated public IDs in the configured Cloudinary folder. Previously uploaded local files may continue to be served from `/uploads/product-covers/` using `UPLOAD_DIR`. Accept only JPEG, PNG, and WebP images, verify the file content matches the declared type, and limit files to 4 MiB. Do not accept SVG or transform images in the MVP. Reject unsupported types with `415 UNSUPPORTED_MEDIA_TYPE`, oversized files with `413 FILE_TOO_LARGE`, missing Cloudinary configuration with `503 UPLOAD_UNAVAILABLE`, and provider failures with `502 UPLOAD_FAILED`.

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
| `502` | Contact message could not be handed to the SMTP relay | `DELIVERY_FAILED` |
| `503` | Contact message delivery is not configured | `DELIVERY_UNAVAILABLE` |
| `502` | Cloud image storage could not accept an image | `UPLOAD_FAILED` |
| `503` | Cloud image storage is not configured | `UPLOAD_UNAVAILABLE` |
| `500` | Unexpected server failure | `INTERNAL_ERROR` |

Error responses must not expose stack traces, credentials, tokens, or private mail-provider details.

## 9. Deployment configuration

The following values must be supplied at deployment and must not be committed:

- `CONTACT_RECIPIENT_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` (the verified sender address).
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
- `UPLOAD_DIR` only when serving previously uploaded local covers; keep those files available while records still reference them.
- `JWT_SECRET` (at least 32 characters); access tokens expire after one hour.

Pagination and image processing are out of scope for the initial release.

## 10. Related documents

- [Project requirements](./ProjectRequirement.md)
- [Project roadmap](../../../PORTFOLIO-ROADMAP.md)