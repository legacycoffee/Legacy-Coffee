# Legacy Coffee API

Django REST API for the Legacy Coffee storefront. Local development uses SQLite; production uses Neon Postgres through `DATABASE_URL`. Static admin assets are served with WhiteNoise, and Render runs the app with Gunicorn.

## Render deployment

The backend is a standalone repository at `legacycoffee/backend`. Its root contains `render.yaml`, `manage.py`, and `requirements.txt`.

1. In Render, create a Blueprint Instance and connect `legacycoffee/backend` on the `main` branch. Render will read `render.yaml` from the repository root and create the free web service in Virginia to match the Neon project region. The free web service can spin down while idle, so the first request after inactivity may be delayed.
2. In the service environment, set `DATABASE_URL` to Neon's **pooled** connection string (the hostname includes `-pooler`) and `DATABASE_URL_UNPOOLED` to Neon's **direct** connection string (no `-pooler`). Keep both values secret. The service uses the pooled URL for web traffic and the direct URL for Django migrations and startup data commands.
3. The Blueprint generates `DJANGO_SECRET_KEY`, sets `DJANGO_DEBUG=false`, adds `api.legacycoffee.org` as the backend domain and allowed host, and configures the GitHub Pages and storefront CORS origins. The Django settings also allow this hostname. If the existing service is not Blueprint-managed, add `api.legacycoffee.org` under **Render service → Settings → Custom Domains**.
4. At your DNS provider, add a CNAME record with host `api` pointing to `backend-44is.onrender.com`. Remove any `AAAA` record for `api`; if you use Cloudflare, keep the CNAME DNS-only while Render verifies it. Then click **Verify** next to the domain in Render. Once DNS propagates and Render issues the TLS certificate, the frontend can use the custom URL.
5. Deploy. The build installs requirements and collects static files. On startup, the service runs migrations against Neon, synchronizes the homepage's 250g, 500g, and 1kg Legacy Coffee products using their existing storefront IDs, optionally creates an initial admin when configured, seeds any missing coffee sizes, and starts Gunicorn. Other product records remain in the database but are inactive so only these three products appear in the storefront. Render's health check uses `/api/health/`.
6. To create the initial admin automatically, set `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_USERNAME`, and `INITIAL_ADMIN_PASSWORD` in the Render service variables before deploying. Use a strong password. Once the first superuser exists, later starts leave it unchanged; remove `INITIAL_ADMIN_PASSWORD` after successful creation. Alternatively, create an admin from the Render Shell with `python manage.py createsuperuser`.
7. For profile and product image uploads, set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. For welcome and order-status emails, newsletter delivery, and reservation notifications, set `RESEND_API_KEY` and `NEWSLETTER_FROM_EMAIL` (the sender must be verified in Resend). Welcome emails are sent once when a customer account is created. Order status emails go to the order contact and, when different, the registered account email. Set `NEWSLETTER_PUBLIC_URL` if the frontend URL differs from `https://legacycoffee.github.io/Legacy-Coffee`.
8. The `/blog` page reads the public Substack RSS feed from `SUBSTACK_PUBLICATION_URL` (defaults to `https://legacycoffee.substack.com`). Publish posts in Substack; the website refreshes its cached feed every 15 minutes. The public Substack subscription link is shown on the Blog page.
9. To enable Google sign-in, create a Google OAuth **Web application** client. Add `https://legacycoffee.org` and `https://www.legacycoffee.org` as authorized JavaScript origins. This app uses Google's popup credential flow, so it does not need an authorized redirect URI. Set the client ID as `GOOGLE_OAUTH_CLIENT_ID` in Render and as the `GOOGLE_CLIENT_ID` Actions repository variable for the GitHub Pages build. Use the same client ID for both; do not put a client secret in the frontend.

The GitHub Pages workflow builds the frontend with `VITE_API_URL=https://api.legacycoffee.org/api`. For local frontend development, set `VITE_GOOGLE_CLIENT_ID` in the frontend environment. Render's filesystem is ephemeral; keep production data in Neon, not SQLite. Do not commit database URLs or other secrets.

Authentication endpoints have additional throttling: password and Google login are limited to 5 requests per minute per client, registration to 3 per hour, and initial admin password setup to 5 per hour. Google sign-in accepts only verified Google email addresses, links a matching existing customer account, and does not allow administrator accounts to use Google sign-in. For shared throttling across multiple backend workers or replicas, set `REDIS_URL` to a Redis connection URL. Without `REDIS_URL`, Django uses its local in-process cache, so throttle counters are not shared across workers.

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

The project root remains in `legacycoffee/Legacy-Coffee`; the `backend` directory is an independent Git repository hosted at `legacycoffee/backend`. Run backend Git commands from this directory so pushes go to its `origin`; run project-wide Git commands from the project root to continue collaborating on the original repository. The backend `.gitignore` excludes local environment files and the SQLite database.

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
- `GET /api/newsletter/substack-posts/` (public, cached list of published Substack posts)
- `POST /api/auth/register/`, `POST /api/auth/login/`, `POST /api/auth/logout/`, `GET|PATCH /api/auth/me/`
- `POST /api/auth/admin-password-setup/` (public setup endpoint; verifies a newly created admin's temporary password, then issues an auth token only after a validated new password is set)
- `POST /api/auth/profile-photo/` (authenticated multipart upload; stores the image in Cloudinary)
- `POST /api/auth/change-password/` (authenticated; verifies the current password before changing it)
- `GET /api/auth/notifications/`, `DELETE /api/auth/notifications/{public_uuid}/`, `DELETE /api/auth/notifications/` with `public_ids` or `all: true`, `PATCH /api/auth/notifications/{public_uuid}/read/` (authenticated users can delete only their own notifications individually, in batches of up to 500, or clear their own list)
- `GET /api/shop/products/`, `GET /api/shop/products/{slug}/`, `GET /api/shop/products/{slug}/reviews/` (catalog responses include the product's opaque `public_id`; storefront product detail URLs use it instead of the catalog slug)
- `GET|POST /api/shop/reviews/?product={slug}`, `GET /api/shop/reviews/eligibility/?product={slug}` (posting and eligibility require authentication; review submission additionally requires a fulfilled order containing the product)
- `GET|POST /api/shop/wishlist/`, `DELETE /api/shop/wishlist/{slug}/` (token authentication)
- `POST /api/shop/share-events/` (records a product share through `whatsapp` or `native`; does not store user identity)
- `POST /api/orders/` (authenticated order creation), `GET /api/orders/mine/` (authenticated order history), `GET /api/orders/mine/{public_uuid}/` (one order for its signed-in owner). Order references are 12 characters; owner-only detail URLs use a separate random UUID and readable item-name slug.
- `POST /api/inquiries/` with `kind` set to `contact`, `quote`, `partner`, `farm_reservation`, or `seedling_reservation`; reservation requests are saved for staff tracking and emailed to `info@legacycoffee.org`
- `POST /api/newsletter/subscribe/` (public, email-only, idempotent signup), `POST /api/newsletter/unsubscribe/` (public)
- `GET|POST /api/dashboard/newsletters/`, `GET|PATCH|DELETE /api/dashboard/newsletters/{id}/`, `POST /api/dashboard/newsletters/{id}/send/`, `POST /api/dashboard/newsletter-images/` (staff-only campaign management; image upload requires Cloudinary; sending requires Resend configuration and sends only to active subscribers)
- `GET /api/dashboard/`, `GET /api/dashboard/orders/`, `PATCH /api/dashboard/orders/{reference}/status/`, `GET|POST /api/dashboard/products/`, `GET|PATCH|DELETE /api/dashboard/products/{slug}/`, `GET /api/dashboard/inquiries/`, `POST /api/dashboard/inquiries/{id}/open/`, `GET /api/dashboard/users/`, `GET /api/dashboard/subscribers/`, `GET|POST /api/dashboard/admins/`, `DELETE /api/dashboard/admins/{public_uuid}/` (authenticated staff only; newly created admins must replace their temporary password before receiving an auth token; opening a new inquiry marks it in progress and removes it from the new-request counter; subscriber inbox supports email search; product endpoints manage the catalog and accept multipart image uploads; admin endpoints manage staff accounts and prevent deleting the last active administrator; order items include catalog image URLs, status updates notify customers, and users endpoint searches customer accounts)
- `GET /api/dashboard/data/transfer/?category={products|requests|newsletters|analytics}&file_format={json|csv|xml}` and `POST /api/dashboard/data/transfer/` (staff-only export and additive import; imports accept a multipart `category` and `file`, reject duplicates, and process the full file atomically; newsletter records are imported as drafts, product images are not included, and files are limited to 5 MB and 5,000 records)
- `GET|DELETE /api/dashboard/notifications/` (staff-only paginated notification list; deletion accepts selected `public_ids` only, in batches up to 500; system-wide notification clearing is not available from the data-clear endpoint)

Token-authenticated requests use `Authorization: Token <token>`. Order submission requires a signed-in account; the API associates each order with that account and uses the account email. The order history endpoint returns only orders belonging to the authenticated user, including status and item details. Product list responses use DRF page-number pagination and expose the storefront product identifier as `id`. Orders accept product IDs, quantities, optional business names, and a wholesale-order flag; the server looks up current active-product prices and snapshots them on each order item. A pro forma PDF invoice is generated when the order is submitted, stored with that order, and available only to its owner at `GET /api/orders/{reference}/invoice/`. It is available to preview and download from the order confirmation, notification, and My Orders pages. It states that no payment has been collected and delivery costs are confirmed separately.

Authentication and profile responses, and the staff-only customer and admin lists, expose each account's random UUID as `id`; deleting an admin also uses that UUID. The database continues to use its internal integer primary key for relations. UUIDs make sequential account IDs harder to enumerate, but they do not replace authorization or conceal identifying profile fields.

Wishlist items are private to the signed-in account. Product share events record the product, share channel, and timestamp, without recording account identity or IP addresses. The admin dashboard summary includes the total number of recorded product shares.

Customers can submit one review per product only after an order containing that product has been marked fulfilled. Pending or confirmed order requests do not qualify.

The React storefront has sign-in and sign-up pages and submits authenticated order requests to this API. The cart and product catalog still use localStorage and local product data. The frontend defaults to `https://api.legacycoffee.org/api`; set `VITE_API_URL=http://127.0.0.1:8000/api` for local development or use another URL to override it.
Account notifications are created for new-account welcome messages, successful sign-ins, order submissions, and order status changes to confirmed, fulfilled, or cancelled. Order notifications include a snapshot of the customer, delivery details, total, and ordered items with product images, names, quantities, and prices. Each account can access only its own notifications; opening a notification marks it as read.
