# Legacy Coffee API

Django REST API for the Legacy Coffee storefront. Local development uses SQLite; production can use PostgreSQL through `DATABASE_URL`. Static admin assets are served with WhiteNoise, and Railway starts the app with Gunicorn.

## Railway deployment

The backend is a standalone repository, so create a Railway service from `gadgetsmajo/legacy` on the `main` branch. Its repository root already contains `manage.py` and the `Procfile`; no monorepo root-directory setting is needed.

1. Add a Railway PostgreSQL service.
2. In the Django service variables, set `DATABASE_URL` to `${{Postgres.DATABASE_URL}}` (replace `Postgres` if your database service has a different name).
3. Set `DJANGO_SECRET_KEY` to a new, long random secret and set `DJANGO_DEBUG` to `false`.
4. The current backend domain is `legacy-production-48e0.up.railway.app`; set `DJANGO_ALLOWED_HOSTS` to that hostname only (without `https://`).
5. Set `CORS_ALLOWED_ORIGINS` to `https://legacycoffee.github.io` (the origin only; do not include `/Legacy-Coffee/`). Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` for profile and product image uploads.
6. To create the initial admin automatically, set `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_USERNAME`, and `INITIAL_ADMIN_PASSWORD` in the Railway service variables. Use a strong password. After migrations, the Procfile promotes an existing account with that email to superuser (updating its username and password from these variables), or creates it if it does not exist. Once a superuser exists, later starts leave it unchanged. Remove `INITIAL_ADMIN_PASSWORD` from Railway after the first successful creation.
7. Deploy. The Procfile runs migrations, creates the initial admin when configured, creates any missing starter products, reactivates the coffee seedlings listing if it was unpublished, collects static files, then starts Gunicorn. A shop data migration also creates or reactivates the seedlings catalog entry on databases missing it; existing product details are preserved.
8. For newsletter delivery and coffee farm or seedling reservation notifications, set `RESEND_API_KEY` and `NEWSLETTER_FROM_EMAIL` in Railway. The sender address or domain must be verified in Resend. Reservation requests are saved and emailed by the backend to `info@legacycoffee.org`; customers do not need to open their own email app. Set `NEWSLETTER_PUBLIC_URL` to the public frontend base URL if it differs from `https://legacycoffee.github.io/Legacy-Coffee`. Newsletter drafts and image uploads work without Resend, but sending newsletters and reservation email notifications require these delivery settings; image uploads also require the Cloudinary variables above.

The GitHub Pages workflow builds the frontend with `VITE_API_URL=https://legacy-production-48e0.up.railway.app/api`. Railway's filesystem is ephemeral; use the PostgreSQL service rather than the local SQLite database for production data. Do not set `DATABASE_URL` to SQLite or commit real secrets.

Wholesale pricing is optional for each product and can be set in Django admin. The wholesale page uses a configured wholesale price when present; otherwise, it calculates an estimate using the retail price.

## Local setup (Windows PowerShell)

From the repository root:

```powershell
Copy-Item backend\.env.example backend\.env
py -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\.venv\Scripts\python.exe backend\manage.py migrate
backend\.venv\Scripts\python.exe backend\manage.py createsuperuser
backend\.venv\Scripts\python.exe backend\manage.py seed_products
backend\.venv\Scripts\python.exe backend\manage.py runserver
```

The API runs at `http://127.0.0.1:8000/`; the Django admin is at `/admin/`. Django loads `backend\.env` automatically, while environment variables already set by the process take precedence. Set the real `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` values in that file for profile and product image uploads. Keep the API secret on the backend only; uploads use a signed request to Cloudinary and store the resulting secure URL. Without these settings the API reports a configuration error instead of storing the image locally. Production startup refuses to use the development key when `DJANGO_DEBUG=false`.

## Repository remotes

The project root remains in `legacycoffee/Legacy-Coffee`; the `backend` directory is also an independent Git repository hosted at `gadgetsmajo/legacy`. Run backend Git commands from this directory so pushes go to its `origin`; run project-wide Git commands from the project root to continue collaborating on the original repository. The backend `.gitignore` excludes local environment files and the SQLite database.

## Apps

- `accounts`: custom email-login user, registration, token login/logout, and current-user profile.
- `shop`: products, authenticated reviews, and private wishlists.
- `orders`: guest or authenticated order requests, with server-calculated UGX prices.
- `inquiries`: contact, quote, and partner inquiries.
- `newsletter`: subscriber opt-in, signed unsubscribe links, and staff-only campaign drafts and delivery.
- `dashboard`: staff-only commerce summary API.

Create the first staff superuser from the backend environment with `py backend\manage.py createsuperuser` (or the equivalent command in the setup steps). There is intentionally no public endpoint for creating superusers. Sign in to `/admin` with that account to review the dashboard; only authenticated Django staff users can access its data.

## API routes

- `GET /api/health/`
- `POST /api/auth/register/`, `POST /api/auth/login/`, `POST /api/auth/logout/`, `GET|PATCH /api/auth/me/`
- `POST /api/auth/admin-password-setup/` (public setup endpoint; verifies a newly created admin's temporary password, then issues an auth token only after a validated new password is set)
- `POST /api/auth/profile-photo/` (authenticated multipart upload; stores the image in Cloudinary)
- `POST /api/auth/change-password/` (authenticated; verifies the current password before changing it)
- `GET /api/auth/notifications/`, `PATCH /api/auth/notifications/{id}/read/` (authenticated customer notifications and unread count)
- `GET /api/shop/products/`, `GET /api/shop/products/{slug}/`, `GET /api/shop/products/{slug}/reviews/`
- `GET|POST /api/shop/reviews/?product={slug}`, `GET /api/shop/reviews/eligibility/?product={slug}` (posting and eligibility require authentication; review submission additionally requires a fulfilled order containing the product)
- `GET|POST /api/shop/wishlist/`, `DELETE /api/shop/wishlist/{slug}/` (token authentication)
- `POST /api/shop/share-events/` (records a product share through `whatsapp` or `native`; does not store user identity)
- `POST /api/orders/` (authenticated order creation), `GET /api/orders/mine/` (authenticated order history for the signed-in user)
- `POST /api/inquiries/` with `kind` set to `contact`, `quote`, `partner`, `farm_reservation`, or `seedling_reservation`; reservation requests are saved for staff tracking and emailed to `info@legacycoffee.org`
- `POST /api/newsletter/subscribe/` (public, email-only, idempotent signup), `POST /api/newsletter/unsubscribe/` (public)
- `GET|POST /api/dashboard/newsletters/`, `GET|PATCH|DELETE /api/dashboard/newsletters/{id}/`, `POST /api/dashboard/newsletters/{id}/send/`, `POST /api/dashboard/newsletter-images/` (staff-only campaign management; image upload requires Cloudinary; sending requires Resend configuration and sends only to active subscribers)
- `GET /api/dashboard/`, `GET /api/dashboard/orders/`, `PATCH /api/dashboard/orders/{reference}/status/`, `GET|POST /api/dashboard/products/`, `GET|PATCH|DELETE /api/dashboard/products/{slug}/`, `GET /api/dashboard/inquiries/`, `POST /api/dashboard/inquiries/{id}/open/`, `GET /api/dashboard/users/`, `GET /api/dashboard/subscribers/`, `GET|POST /api/dashboard/admins/`, `DELETE /api/dashboard/admins/{id}/` (authenticated staff only; newly created admins must replace their temporary password before receiving an auth token; opening a new inquiry marks it in progress and removes it from the new-request counter; subscriber inbox supports email search; product endpoints manage the catalog and accept multipart image uploads; admin endpoints manage staff accounts and prevent deleting the last active administrator; order items include catalog image URLs, status updates notify customers, and users endpoint searches customer accounts)

Token-authenticated requests use `Authorization: Token <token>`. Order submission requires a signed-in account; the API associates each order with that account and uses the account email. The order history endpoint returns only orders belonging to the authenticated user, including status and item details. Product list responses use DRF page-number pagination and expose the storefront product identifier as `id`. Orders accept product IDs, quantities, optional business names, and a wholesale-order flag; the server looks up current active-product prices and snapshots them on each order item. A pro forma PDF invoice is generated when the order is submitted, stored with that order, and available only to its owner at `GET /api/orders/{reference}/invoice/`. It is available to preview and download from the order confirmation, notification, and My Orders pages. It states that no payment has been collected and delivery costs are confirmed separately.

Wishlist items are private to the signed-in account. Product share events record the product, share channel, and timestamp, without recording account identity or IP addresses. The admin dashboard summary includes the total number of recorded product shares.

Customers can submit one review per product only after an order containing that product has been marked fulfilled. Pending or confirmed order requests do not qualify.

The React storefront has sign-in and sign-up pages and submits authenticated order requests to this API. The cart and product catalog still use localStorage and local product data. Set `VITE_API_URL` in the frontend environment to override the default `http://127.0.0.1:8000/api` API URL.
Account notifications are created for new-account welcome messages, successful sign-ins, order submissions, and order status changes to confirmed, fulfilled, or cancelled. Order notifications include a snapshot of the customer, delivery details, total, and ordered items with product images, names, quantities, and prices. Each account can access only its own notifications; opening a notification marks it as read.
