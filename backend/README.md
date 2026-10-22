# Legacy Coffee API

Django REST API for the Legacy Coffee storefront. The initial setup uses SQLite, token authentication, and CORS origins for the local Vite development server.

## Local setup (Windows PowerShell)

From the repository root:

```powershell
py -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\.venv\Scripts\python.exe backend\manage.py migrate
backend\.venv\Scripts\python.exe backend\manage.py createsuperuser
backend\.venv\Scripts\python.exe backend\manage.py seed_products
backend\.venv\Scripts\python.exe backend\manage.py runserver
```

The API runs at `http://127.0.0.1:8000/`; the Django admin is at `/admin/`.
Set `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, and `CORS_ALLOWED_ORIGINS` in the process environment before deployment. Production startup refuses to use the development key when `DJANGO_DEBUG=false`.

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
- `GET /api/shop/products/`, `GET /api/shop/products/{slug}/`, `GET /api/shop/products/{slug}/reviews/`
- `GET|POST /api/shop/reviews/?product={slug}` (posting requires token authentication)
- `GET|POST /api/shop/wishlist/`, `DELETE /api/shop/wishlist/{slug}/` (token authentication)
- `POST /api/orders/`
- `POST /api/inquiries/` with `kind` set to `contact`, `quote`, or `partner`
- `POST /api/newsletter/subscribe/`, `POST /api/newsletter/unsubscribe/`
- `GET /api/dashboard/`, `GET /api/dashboard/orders/`, `GET /api/dashboard/inquiries/` (authenticated staff only)

Token-authenticated requests use `Authorization: Token <token>`. Order submission requires a signed-in account; the API associates each order with that account and uses the account email. Product list responses use DRF page-number pagination and expose the storefront product identifier as `id`. Orders accept product IDs and quantities only; the server looks up current active-product prices and snapshots them on each order item.

The React storefront has sign-in and sign-up pages and submits authenticated order requests to this API. The cart and product catalog still use localStorage and local product data. Set `VITE_API_URL` in the frontend environment to override the default `http://127.0.0.1:8000/api` API URL.
