# E-Commerce Microservices — Project Reference Guide

---

## Table of Contents

1. [Startup Guide](#1-startup-guide)
2. [All Test Cases](#2-all-test-cases)
3. [SQL Query Use Cases](#3-sql-query-use-cases)
4. [Important Things to Know](#4-important-things-to-know)
5. [Terminology Explained](#5-terminology-explained)

---

## 1. Startup Guide

### Step 1 — Build all service JARs

Run these one by one inside `ecommerce-project/`:

```bash
cd api-gateway      && mvn clean package -DskipTests && cd ..
cd user-service     && mvn clean package -DskipTests && cd ..
cd product-service  && mvn clean package -DskipTests && cd ..
cd order-service    && mvn clean package -DskipTests && cd ..
```

> **Why -DskipTests?** Skips unit tests so it builds faster. Since there are no test files written, this is fine.

---

### Step 2 — Start Docker

```bash
docker-compose up --build
```

First time or after code changes always use `--build`.
If only config changed (no code), you can use:

```bash
docker-compose up
```

To stop:

```bash
docker-compose down
```

To fully reset (wipes the database volume too):

```bash
docker-compose down -v
```

---

### Step 3 — Serve the UI

```bash
python -m http.server 5500
```

Open in browser: `http://localhost:5500/app.html`

> The UI talks ONLY to `http://localhost:8080` (the API Gateway). Never call service ports (8081/8082/8083) directly from UI.

---

### Step 4 — Access MySQL inside Docker

```bash
docker exec -it mysql mysql -u root -proot
```

You are now inside the MySQL shell. Use the queries in Section 3.

---

### Step 5 — Check container status

```bash
docker ps
```

All 5 containers should be running:

| Container | Port |
|---|---|
| mysql | 3307 (host) → 3306 (container) |
| user-service | 8081 |
| product-service | 8082 |
| order-service | 8083 |
| api-gateway | 8080 |

Check logs for a specific service:

```bash
docker logs user-service --tail 30
docker logs product-service --tail 30
docker logs order-service --tail 30
docker logs api-gateway --tail 30
```

---

## 2. All Test Cases

Base URL for all calls: `http://localhost:8080`

---

### USER SERVICE

#### TC-U1 — Valid Registration ✅

```
POST /users/register
Content-Type: application/json

{
  "name": "Rishabh",
  "email": "rishabh@gmail.com",
  "password": "1234"
}
```

Expected: `200 OK` — user object with `id`

---

#### TC-U2 — Missing Field ❌

```
POST /users/register

{
  "name": "Rishabh"
}
```

Expected: `400 Bad Request` — `"Email is required."` or `"Password is required."`

---

#### TC-U3 — Fetch Valid User ✅

```
GET /users/1
```

Expected: `200 OK` — user object

---

#### TC-U4 — Fetch Invalid User ❌

```
GET /users/999
```

Expected: `null` or empty (user not found)

---

#### TC-U5 — Duplicate Email ❌

```
POST /users/register

{
  "name": "Test",
  "email": "rishabh@gmail.com",
  "password": "1234"
}
```

Expected: `400 Bad Request` — `"Email already exists"`

---

#### TC-U6 — Login Valid ✅

```
GET /users/login?email=rishabh@gmail.com
```

Expected: `200 OK` — user object (UI then checks password client-side)

---

### PRODUCT SERVICE

#### TC-P1 — Add Product ✅

```
POST /products
Content-Type: application/json

{
  "name": "Laptop",
  "description": "Gaming laptop",
  "price": 80000,
  "stock": 10
}
```

Expected: `200 OK` — product with `id`

---

#### TC-P2 — Negative Price ❌

```
POST /products

{
  "name": "Laptop",
  "price": -100,
  "stock": 10
}
```

Expected: `400 Bad Request` — `"Price must be greater than 0."`

---

#### TC-P3 — List All Products ✅

```
GET /products
```

Expected: `200 OK` — array of products

---

#### TC-P4 — Fetch Invalid Product ❌

```
GET /products/999
```

Expected: `404 Not Found`

---

#### TC-P5 — Reduce Stock Valid ✅

```
PUT /products/reduce/1?quantity=2
```

Expected: `200 OK` — updated product (stock reduced by 2)

---

#### TC-P6 — Reduce Stock Exceeds Available ❌

```
PUT /products/reduce/1?quantity=9999
```

Expected: `400 Bad Request` — `"Not enough stock"`

---

#### TC-P7 — Set Negative Stock ❌

```
PUT /products/updateStock/1?stock=-10
```

Expected: `400 Bad Request` — `"Stock cannot be negative"`

---

#### TC-P8 — Edit Product ✅

```
PUT /products/1
Content-Type: application/json

{
  "name": "Laptop Pro",
  "description": "Updated",
  "price": 85000,
  "stock": 15
}
```

Expected: `200 OK` — updated product

---

#### TC-P9 — Delete Product ✅

```
DELETE /products/1
```

Expected: `200 OK` — `"Product deleted."`

---

### ORDER SERVICE

#### TC-O1 — Valid Order ✅

```
POST /orders
Content-Type: application/json

{
  "userId": 1,
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

Expected: `200 OK` — order with `id`, `totalAmount`, `status: "PLACED"`

> Note: `price` is NOT sent — backend fetches it from Product Service.

---

#### TC-O2 — Empty Items ❌

```
POST /orders

{
  "userId": 1,
  "items": []
}
```

Expected: `400 Bad Request` — `"Order must contain at least one item"`

---

#### TC-O3 — Invalid User ❌

```
POST /orders

{
  "userId": 999,
  "items": [{ "productId": 1, "quantity": 1 }]
}
```

Expected: `500` — `"User not found"`

---

#### TC-O4 — Invalid Product ❌

```
POST /orders

{
  "userId": 1,
  "items": [{ "productId": 999, "quantity": 1 }]
}
```

Expected: `500` — `"Product not found"`

---

#### TC-O5 — Zero Quantity ❌

```
POST /orders

{
  "userId": 1,
  "items": [{ "productId": 1, "quantity": 0 }]
}
```

Expected: `400 Bad Request` — `"Quantity must be greater than 0"`

---

#### TC-O6 — Quantity Exceeds Stock ❌

```
POST /orders

{
  "userId": 1,
  "items": [{ "productId": 1, "quantity": 9999 }]
}
```

Expected: `500` — `"Insufficient stock"`

---

#### TC-O7 — Price Manipulation Attempt (Security) ✅

```
POST /orders

{
  "userId": 1,
  "items": [{ "productId": 1, "quantity": 2, "price": 1 }]
}
```

Expected: `200 OK` — price field is **ignored**, real price fetched from Product Service.

---

#### TC-O8 — Missing Product ID ❌

```
POST /orders

{
  "userId": 1,
  "items": [{ "quantity": 2 }]
}
```

Expected: `400 Bad Request` — `"Product ID is required"`

---

#### TC-O9 — Get Order by ID ✅

```
GET /orders/1
```

Expected: `200 OK` — order object

---

#### TC-O10 — Get Orders by User ✅

```
GET /orders/user/1
```

Expected: `200 OK` — list of orders for that user

---

#### TC-O11 — Quantity Above 100 ❌

```
POST /orders

{
  "userId": 1,
  "items": [{ "productId": 1, "quantity": 101 }]
}
```

Expected: `400 Bad Request` — `"Quantity cannot exceed 100"`

---

## 3. SQL Query Use Cases

### Connect to MySQL inside Docker

```bash
docker exec -it mysql mysql -u root -proot
```

---

### View all data

```sql
USE user_db;
SELECT * FROM users;

USE product_db;
SELECT * FROM products;

USE order_db;
SELECT * FROM orders;
SELECT * FROM order_items;

EXIT;
```

---

### Clear all data (reset rows, reset IDs to 1)

> Order matters — foreign keys: `order_items` → `orders` first.

```sql
USE order_db;
DELETE FROM order_items;
DELETE FROM orders;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE order_items AUTO_INCREMENT = 1;

USE product_db;
DELETE FROM products;
ALTER TABLE products AUTO_INCREMENT = 1;

USE user_db;
DELETE FROM users;
ALTER TABLE users AUTO_INCREMENT = 1;

EXIT;
```

---

### Delete a specific user

```sql
USE user_db;
DELETE FROM users WHERE id = 1;
EXIT;
```

---

### Delete a specific product

```sql
USE product_db;
DELETE FROM products WHERE id = 1;
EXIT;
```

---

### Delete orders for a specific user

```sql
USE order_db;
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = 1);
DELETE FROM orders WHERE user_id = 1;
EXIT;
```

---

### Manually update a product's stock

```sql
USE product_db;
UPDATE products SET stock = 20 WHERE id = 1;
EXIT;
```

---

### Manually update a product's price

```sql
USE product_db;
UPDATE products SET price = 75000 WHERE id = 1;
EXIT;
```

---

### Check all databases available

```sql
SHOW DATABASES;
```

---

### Check tables inside a database

```sql
USE order_db;
SHOW TABLES;
```

---

### Describe a table structure

```sql
USE user_db;
DESCRIBE users;

USE product_db;
DESCRIBE products;

USE order_db;
DESCRIBE orders;
DESCRIBE order_items;
```

---

## 4. Important Things to Know

### 🔴 Price is NEVER sent from the UI

When placing an order, the UI only sends `productId` and `quantity`. The backend fetches the price from Product Service. This prevents price manipulation — a user cannot send `"price": 1` to get a cheap product.

---

### 🔴 Use container names, NOT localhost, inside Docker

Inside Docker, services cannot reach each other using `localhost`. They use container names:

| Wrong | Correct |
|---|---|
| `http://localhost:8081` | `http://user-service:8081` |
| `http://localhost:8082` | `http://product-service:8082` |

The UI (running in your browser, outside Docker) DOES use `http://localhost:8080` because it's talking to the API Gateway from outside the Docker network.

---

### 🔴 Rebuild JAR before `docker-compose up --build`

Docker builds the image from the compiled JAR file in `target/`. If you change Java code and don't rebuild the JAR, Docker will use the old code.

Always:
```bash
mvn clean package -DskipTests   # inside the changed service folder
docker-compose up --build       # then restart
```

---

### 🟡 The UI auto-refreshes every 3 seconds

`app.js` runs `loadProducts()` and `loadOrders()` every 3 seconds via `setInterval`. This means if you make changes via Postman, the UI will automatically reflect them within 3 seconds.

---

### 🟡 `ddl-auto=update` means Hibernate manages the schema

You do NOT manually create tables. Hibernate reads your `@Entity` classes and creates/updates tables automatically on startup. The `init.sql` only creates the databases (`user_db`, `product_db`, `order_db`) — NOT the tables.

---

### 🟡 Delete order_items before orders (foreign key rule)

`order_items` has a foreign key pointing to `orders`. If you try to delete from `orders` first, MySQL will throw a foreign key constraint error. Always delete child records before parent records.

---

### 🟢 The UI serves from Python, not Docker

The HTML/CSS/JS files are NOT inside any Docker container. You serve them with:

```bash
python -m http.server 5500
```

The browser loads the files locally and makes API calls to `http://localhost:8080` (the Gateway).

---

### 🟢 Admin password is hardcoded

The admin password `admin123` is checked only in the **browser** (JavaScript), not by any backend service. This is fine for a demo project. In a real system, admin auth would be a proper backend role/JWT check.

---

## 5. Terminology Explained

---

### API Gateway

A single entry point for all client requests. Instead of the UI knowing about 3 different services on 3 different ports, it only knows one URL (`localhost:8080`). The gateway reads the path and forwards the request to the correct service.

```
/users/**    →  user-service:8081
/products/** →  product-service:8082
/orders/**   →  order-service:8083
```

**Why?** Simplicity, security, and one place to add features like logging or authentication later.

---

### CORS (Cross-Origin Resource Sharing)

A browser security rule. By default, a browser blocks JavaScript from making requests to a **different origin** (different domain, port, or protocol) than the page it loaded from.

Your UI loads from `http://localhost:5500` (Python server) but calls `http://localhost:8080` (API Gateway) — these are different ports, so different origins. The browser would block it by default.

The `CorsConfig.java` in the API Gateway tells the browser: *"It's okay, allow all origins."*

```java
config.addAllowedOrigin("*");   // allow any origin
config.addAllowedMethod("*");   // allow GET, POST, PUT, DELETE, etc.
config.addAllowedHeader("*");   // allow any header
```

**In Postman**, CORS doesn't apply because Postman is not a browser — it doesn't enforce this rule.

---

### Microservices

An architectural style where an application is split into small, independent services. Each service:
- Does one thing only (users, products, orders)
- Has its own database
- Can be built, deployed, and scaled independently
- Communicates with others via HTTP (REST)

Opposite of a **monolith** where everything (users, products, orders) is in one big codebase and one database.

---

### Docker & Docker Compose

**Docker** packages an application and all its dependencies into a portable **container** — like a lightweight virtual machine that runs the same everywhere.

**Docker Compose** lets you define and run multiple containers together. Your `docker-compose.yml` defines 5 containers (mysql, user-service, product-service, order-service, api-gateway) and how they connect.

---

### RestTemplate

A Spring class used to make HTTP calls from one service to another. The Order Service uses it to call User Service and Product Service during order placement.

```java
// Order Service calling Product Service
restTemplate.getForObject("http://product-service:8082/products/1", Map.class);
```

---

### JPA / Hibernate

**JPA** (Java Persistence API) is a standard for mapping Java objects to database tables.
**Hibernate** is the most popular implementation of JPA.

Instead of writing SQL manually, you write Java classes (`@Entity`) and Hibernate generates the SQL and manages the database automatically.

---

### HikariCP (Connection Pool)

A database connection pool. Opening a new connection to MySQL every time a request comes in is slow. HikariCP keeps a pool of ready-made connections (max 5 in your config) and reuses them — much faster.

---

### `@JsonManagedReference` / `@JsonBackReference`

When `Order` contains a list of `OrderItem` and each `OrderItem` refers back to its `Order`, Jackson (the JSON library) gets stuck in an infinite loop when trying to convert to JSON:

```
Order → [OrderItem → Order → [OrderItem → Order → ...]]
```

`@JsonManagedReference` on the `Order` side and `@JsonBackReference` on the `OrderItem` side breaks this loop — the back side is simply not serialized to JSON.

---

### `ddl-auto=update`

Controls what Hibernate does to the database schema on startup:

| Value | What it does |
|---|---|
| `update` | Adds missing tables/columns, never deletes |
| `create` | Drops everything and recreates on every start ⚠️ |
| `create-drop` | Creates on start, drops on shutdown ⚠️ |
| `validate` | Validates schema matches entities, errors if not |
| `none` | Does nothing — you manage schema manually |

`update` is the right choice for development.

---

### `CascadeType.ALL`

On the `Order → OrderItem` relationship. When you save an `Order`, Hibernate automatically saves all its `OrderItem` records too. When you delete an `Order`, all its items are deleted too. You don't have to save/delete items manually.

---

### ResponseEntity

A Spring class that lets you control what HTTP status code and body you return from a controller. Instead of just returning an object (which always gives 200), you can return:

```java
ResponseEntity.ok(product)                  // 200 with body
ResponseEntity.badRequest().body("Error")   // 400 with message
ResponseEntity.notFound().build()           // 404 no body
ResponseEntity.internalServerError()        // 500
```

---
