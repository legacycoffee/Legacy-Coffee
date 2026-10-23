# Legacy Coffee API

Django REST API for the Legacy Coffee storefront. The initial setup uses SQLite, token authentication, and CORS origins for the local Vite development server.

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

The API runs at `http://127.0.0.1:8000/`; the Django admin is at `/admin/`. Django loads `backend\.env` automatically, while environment variables already set by the process take precedence. Set the real `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` values in that file for profile photo uploads. Keep the API secret on the backend only; uploads use a signed request to Cloudinary and store the resulting secure URL on the user account. Without these settings the API reports a configuration error instead of storing the image locally. Production startup refuses to use the development key when `DJANGO_DEBUG=false`.

## Apps

- `accounts`: custom email-login user, registration, token login/logout, and current-user profile.
- `shop`: products, authenticated reviews, and private wishlists.
- `orders`: guest or authenticated order requests, with server-calculated UGX prices.
- `inquiries`: contact, quote, and partner inquiries.
- `newsletter`: subscriber opt-in and unsubscribe endpoints.
- `dashboard`: staff-only commerce summary API.

Create the first staff superuser from the backend environment with `py backend\manage.py createsuperuser` (or the equivalent command in the setup steps). There is intentionally no public endpoint for creating superusers. Sign in to `/admin` with that account to review the dashboard; only authenticated Django staff users can access its data.

## API routes

- `GET /api/health/`
- `POST /api/auth/register/`, `POST /api/auth/login/`, `POST /api/auth/logout/`, `GET|PATCH /api/auth/me/`
- `POST /api/auth/profile-photo/` (authenticated multipart upload; stores the image in Cloudinary)
- `GET /api/shop/products/`, `GET /api/shop/products/{slug}/`, `GET /api/shop/products/{slug}/reviews/`
- `GET|POST /api/shop/reviews/?product={slug}`, `GET /api/shop/reviews/eligibility/?product={slug}` (posting and eligibility require authentication; review submission additionally requires a fulfilled order containing the product)
- `GET|POST /api/shop/wishlist/`, `DELETE /api/shop/wishlist/{slug}/` (token authentication)
- `POST /api/shop/share-events/` (records a product share through `whatsapp` or `native`; does not store user identity)
- `POST /api/orders/` (authenticated order creation), `GET /api/orders/mine/` (authenticated order history for the signed-in user)
- `POST /api/inquiries/` with `kind` set to `contact`, `quote`, or `partner`
- `POST /api/newsletter/subscribe/`, `POST /api/newsletter/unsubscribe/`
- `GET /api/dashboard/`, `GET /api/dashboard/orders/`, `GET /api/dashboard/inquiries/` (authenticated staff only)

Token-authenticated requests use `Authorization: Token <token>`. Order submission requires a signed-in account; the API associates each order with that account and uses the account email. The order history endpoint returns only orders belonging to the authenticated user, including status and item details. Product list responses use DRF page-number pagination and expose the storefront product identifier as `id`. Orders accept product IDs and quantities only; the server looks up current active-product prices and snapshots them on each order item.

Wishlist items are private to the signed-in account. Product share events record the product, share channel, and timestamp, without recording account identity or IP addresses. The admin dashboard summary includes the total number of recorded product shares.

Customers can submit one review per product only after an order containing that product has been marked fulfilled. Pending or confirmed order requests do not qualify.

The React storefront has sign-in and sign-up pages and submits authenticated order requests to this API. The cart and product catalog still use localStorage and local product data. Set `VITE_API_URL` in the frontend environment to override the default `http://127.0.0.1:8000/api` API URL.
