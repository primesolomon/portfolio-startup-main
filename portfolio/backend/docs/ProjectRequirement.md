# Project Requirements: Startup Portfolio CMS

## 1. Overview

Build a public portfolio website that presents the startup, its founders, and its products/projects. Provide a private, CMS-style admin area so the founders can manage portfolio content and its publishing workflow without changing application code.

The public website and admin area are part of the same product. The admin interface manages content; page layouts and visual design remain implemented in code for the initial release.

## 2. Goals

- Introduce the startup and its founders to visitors.
- Present the startup's products/projects in a clear, browsable portfolio.
- Provide public About and Contact sections.
- Let authorized admins manage public site content, product images, and the product publication workflow.
- Keep unpublished or archived content out of the public site.

## 3. Users

### Public visitor

A prospective customer, partner, investor, or other visitor who can browse public startup, founder, and product information and find the startup's contact information.

### Admin

A founder or other authorized user who signs in to manage content through the CMS-style admin area.

## 4. Scope

### MVP

- Public home page introducing the startup and its founders, with featured products/projects.
- Public products listing and product detail pages.
- Public About section.
- Public Contact section with a form that sends client messages to a designated startup email address.
- Admin sign-in and sign-out.
- CMS editing for startup information, founder profiles, About and Contact content, and products/projects.
- Admin product listing and create/edit operations.
- Upload one cover image for each product/project.
- Product publishing workflow: draft, published, and archived.
- Public pages show published products only.
- Protected admin operations enforced by the backend API.
- Both founders have the same admin permissions.

### Future

- Admin inbox for viewing and managing messages submitted through the Contact form.
- Additional CMS-managed content types or page editing, if needed after the MVP.

### Out of scope for the initial release

- A drag-and-drop page builder or arbitrary page-layout editing.
- Storing or managing submitted client messages in the admin CMS.

## 5. Functional requirements

### Public website

- **PUB-01:** Visitors can view an introduction to the startup and its founders.
- **PUB-02:** Visitors can browse a listing of published products/projects.
- **PUB-03:** Visitors can open a product/project detail page with its description, image, and relevant links.
- **PUB-04:** Visitors can access public About and Contact sections.
- **PUB-05:** Draft and archived products/projects are not exposed in public listings or detail pages.
- **PUB-06:** Public pages provide responsive layouts for mobile and desktop.
- **PUB-07:** Visitors can submit a message through the Contact form; the form reports whether submission succeeded or failed.
- **PUB-08:** A submitted Contact form message is delivered to a designated startup email address. Messages are not available in the admin CMS in the MVP.

### CMS-style admin

- **ADM-01:** An admin can sign in and sign out.
- **ADM-02:** An authenticated admin can view and edit startup information, founder profiles, About content, and Contact content.
- **ADM-02a:** Changes to startup, founder, About, and Contact content are published immediately when saved.
- **ADM-03:** An authenticated admin can view and manage product/project entries.
- **ADM-04:** An admin can create and edit product/project content and upload one cover image per entry.
- **ADM-05:** An admin can save a product/project as a draft, publish it, unpublish it back to draft, or archive it.
- **ADM-06:** Both founders have the same admin permissions in the MVP.
- **ADM-07:** The admin interface reports loading, validation, success, and error states clearly.
- **ADM-08:** The backend rejects unauthenticated or unauthorized requests to admin operations; hiding controls in the frontend alone is insufficient.

### Contact messages

- **FUT-01:** In a later implementation, an admin can view and manage submitted client messages in the admin area.

## 6. Product/project content

The MVP product/project record includes:

- Title and URL-friendly slug.
- Short summary and full description.
- One uploaded cover image.
- Category.
- Optional project and repository links.
- Featured status.
- Publication status: draft, published, or archived.
- Created and updated timestamps.

The exact required/optional rules for fields, image constraints, and image storage approach remain to be agreed. The API contract and database schema should reflect those decisions.

## 7. Content management boundaries

- The admin area is a CMS for managing portfolio content and publishing workflow.
- Admins can edit startup information, founder profiles, About and Contact content, and products/projects.
- Product/project management, one cover-image upload per product, and product publication workflow are in the MVP scope.
- Startup, founder, About, and Contact content is published immediately when saved; draft/publish/archive states apply to products/projects only.
- The Contact form sends submitted messages to a designated startup email; an admin inbox is future scope.
- Page structure and visual design remain in code for the initial release; a page builder is not required.

## 8. Non-functional requirements

- The backend is the authority for authentication and authorization.
- Database credentials and other secrets must not be exposed in frontend code or committed to source control.
- User input must be validated, and failures must be communicated clearly.
- Contact form submissions must provide clear success/failure feedback and be delivered to the configured startup email address.
- The site must work on mobile and desktop.
- The implementation should use the agreed project stack: HTML, CSS, and browser JavaScript; Node.js/Express; and MySQL. The frontend accesses data through the backend API and never connects directly to MySQL.

## 9. Success criteria

- Visitors can learn about the startup and founders, browse published products/projects, and find public contact information.
- An admin can manage startup, founder, About, Contact, and product/project content without editing application code.
- An admin can upload a product cover image and control the product's publishing status.
- Visitors can submit a Contact form message and receive clear feedback; the message is delivered to the designated startup email.
- Draft and archived products/projects remain unavailable on public pages.
- Admin-only API operations are protected by backend authentication and authorization.
- Public pages and admin workflows provide usable mobile layouts and clear feedback for errors and empty states.

## 10. Open decisions

These implementation and content details can be finalized before the corresponding work begins:

1. What startup and founder details, biographies, and images should appear publicly?
2. Which fields are required for products/projects, and what fields are required on the Contact form?
3. What email address and delivery service will receive Contact form submissions?
4. Where will uploaded product images be stored, and what file types and size limits are allowed?
5. What branding, navigation, and visual design should the public site use?
6. Where will the frontend, API, and database be deployed?

## 11. Technical references

- [Project roadmap](../../../PORTFOLIO-ROADMAP.md)
- [Backend API contract](./api-contract.md)