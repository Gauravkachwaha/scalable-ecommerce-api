# Ain E-Commerce Backend API

Base URL: `http://localhost:5000`

Protected routes require:

```http
Authorization: Bearer <jwt>
```

Admin routes require a token for a user with `role: "admin"`.

## Health

### `GET /health`

Returns service status.

## Auth

### `POST /api/auth/register`

Creates a customer account.

```json
{
  "name": "Customer Name",
  "username": "customer1",
  "email": "customer@example.com",
  "password": "secret123"
}
```

### `POST /api/auth/login`

Logs in by username or email.

```json
{
  "identifier": "customer@example.com",
  "password": "secret123"
}
```

### `POST /api/auth/bootstrap-admin`

Creates the first admin account. Requires `ADMIN_BOOTSTRAP_SECRET` in `.env`.
This endpoint refuses to create another admin once an admin already exists.

```json
{
  "name": "Admin User",
  "username": "admin",
  "email": "admin@example.com",
  "password": "secret123",
  "bootstrapSecret": "one_time_admin_setup_secret"
}
```

## Products

### `GET /api/products`

Query params:

- `keyword`
- `category`
- `minPrice`
- `maxPrice`
- `page`
- `limit` with max `100`

### `GET /api/products/:id`

Returns one product.

### `POST /api/products`

Admin only. Multipart form-data, supports up to five `images` files.

Fields:

- `name`
- `description`
- `price`
- `stock`
- `category`

### `PUT /api/products/:id`

Admin only. Accepts the same fields as create; fields are partial.

### `DELETE /api/products/:id`

Admin only.

## Cart

### `GET /api/cart`

Customer protected. Returns current user's cart.

### `POST /api/cart`

Customer protected.

```json
{
  "productId": "product_id",
  "quantity": 2
}
```

### `PUT /api/cart/:productId`

Customer protected. Replaces quantity for one item.

```json
{
  "quantity": 3
}
```

### `DELETE /api/cart/:productId`

Customer protected. Removes one item.

### `DELETE /api/cart`

Customer protected. Clears the cart.

## Orders

### `POST /api/orders`

Customer protected. Creates an order and reduces stock inside a MongoDB transaction.

```json
{
  "items": [
    {
      "product": "product_id",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "address": "123 Main Street",
    "city": "Mumbai",
    "postalCode": "400001",
    "country": "India"
  }
}
```

### `GET /api/orders`

Customer protected. Returns current user's orders.

### `GET /api/orders/:id`

Customer protected. Returns one order owned by the current user.

## Payments

### `POST /api/payment/create-order`

Customer protected. Creates a Razorpay order for an existing local order.

```json
{
  "orderId": "local_order_id"
}
```

### `POST /api/payment/webhook`

Razorpay webhook endpoint. Configure this URL in Razorpay and use the value from
`RAZORPAY_WEBHOOK_SECRET` for signature verification.

## Analytics

Admin only.

### `GET /api/analytics/summary`

Overall sales summary.

### `GET /api/analytics/category`

Revenue grouped by product category.

### `GET /api/analytics/top-products`

Top-selling products.

### `GET /api/analytics/daily`

Daily sales grouped by date.
