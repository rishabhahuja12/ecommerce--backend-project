# E-Commerce Microservices Backend

Dockerized microservices-based e-commerce backend built with Spring Boot, MySQL, and an API Gateway.

## Table of Contents

1. [Introduction](#introduction)
2. [Objective](#objective)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Services and Responsibilities](#services-and-responsibilities)
6. [Business Logic Flow](#business-logic-flow)
7. [API Reference](#api-reference)
8. [Setup and Run Guide](#setup-and-run-guide)
9. [Database Queries and Maintenance](#database-queries-and-maintenance)
10. [Test Cases](#test-cases)
11. [Troubleshooting](#troubleshooting)
12. [Terminology](#terminology)
13. [Scope and Future Improvements](#scope-and-future-improvements)

## Introduction

This project demonstrates a distributed e-commerce backend where each domain concern is implemented as an independent microservice. The system is containerized and exposed through one entry point (API Gateway), which makes client interaction simple while preserving service isolation.

## Objective

- Build a scalable backend using microservices.
- Separate business logic into independent services.
- Implement inter-service communication through REST APIs.
- Use database-per-service boundaries.
- Run the full stack with Docker Compose.
- Expose a unified API through an API Gateway.

## Architecture

### Architectural Style

- Microservices Architecture
- API Gateway Pattern
- Database per Service Pattern

### High-Level Diagram

```text
Browser / Postman / UI
				|
				v
API Gateway (8080)
	 |        |        |
	 v        v        v
User     Product    Order
Service  Service    Service
	 \        |        /
		\-------+-------/
						|
					 MySQL
```

### Gateway Routing

- `/users/**` -> `user-service:8081`
- `/products/**` -> `product-service:8082`
- `/orders/**` -> `order-service:8083`

### Communication Rules

- External clients talk only to `http://localhost:8080`.
- Inside Docker network, services use container names (`user-service`, `product-service`, `order-service`).
- `localhost` must not be used for container-to-container calls.

## Project Structure

```text
ecommerce-project/
|- api-gateway/
|- user-service/
|- product-service/
|- order-service/
|- docker-compose.yml
|- init.sql
|- app.html
|- app.css
|- app.js
|- README.md
```

### Layered Structure per Service

```text
controller -> service -> repository -> database
```

- `controller`: HTTP endpoints and request handling.
- `service`: business logic and coordination.
- `repository`: persistence with Spring Data JPA.
- `entity`: table mapping and relationships.

## Services and Responsibilities

### API Gateway

- Single entry point.
- Request routing to all services.
- CORS configuration for browser clients.
- No domain business logic.

### User Service

- Register user.
- Fetch user by ID.
- Validation support for Order flow.

Database:

- `user_db`
- Table `users`: `id`, `name`, `email`, `password`

### Product Service

- Add product.
- List products.
- Get product by ID.
- Delete product.
- Reduce stock (internal operation).
- Product price and stock are the source of truth.

Database:

- `product_db`
- Table `products`: `id`, `name`, `description`, `price`, `stock`

### Order Service

- Place order.
- Get order by ID.
- Get orders by user.
- Validate user/product and coordinate stock reduction.

Database:

- `order_db`
- Table `orders`: `id`, `user_id`, `total_amount`, `status`
- Table `order_items`: `id`, `product_id`, `quantity`, `price`, `order_id`

## Business Logic Flow

### Order Placement

1. Client sends `POST /orders` through the API Gateway.
2. Order Service validates request (`userId`, non-empty items, valid `productId`, quantity bounds).
3. Order Service validates user through User Service.
4. For each item in one loop:
	 - Fetch product from Product Service.
	 - Validate stock and quantity.
	 - Read authoritative price from Product Service.
	 - Reduce stock immediately through Product Service.
	 - Bind item to order and accumulate total.
5. Persist order and items.
6. Return order response.

### Core Rules

- Price is never trusted from client input.
- Quantity must be greater than 0.
- Stock updates are controlled by Product Service.
- Service names are used for internal calls in Docker.

## API Reference

Base URL:

```text
http://localhost:8080
```

### User APIs

- `POST /users/register`
- `GET /users/{id}`
- `GET /users/login?email=<email>`

Example request:

```json
{
	"name": "Rishabh",
	"email": "rishabh@gmail.com",
	"password": "1234"
}
```

### Product APIs

- `POST /products`
- `GET /products`
- `GET /products/{id}`
- `PUT /products/{id}`
- `DELETE /products/{id}`
- `PUT /products/reduce/{id}?quantity=x` (internal)
- `PUT /products/updateStock/{id}?stock=x` (if enabled)

Example request:

```json
{
	"name": "Laptop",
	"description": "Gaming laptop",
	"price": 80000,
	"stock": 10
}
```

### Order APIs

- `POST /orders`
- `GET /orders/{id}`
- `GET /orders/user/{userId}`

Example request:

```json
{
	"userId": 1,
	"items": [
		{ "productId": 1, "quantity": 2 }
	]
}
```

## Setup and Run Guide

### Prerequisites

- Java 17
- Maven
- Docker Desktop
- Python 3 (optional, for static UI hosting)

### Build JARs

From project root:

```bash
cd api-gateway && mvn clean package -DskipTests && cd ..
cd user-service && mvn clean package -DskipTests && cd ..
cd product-service && mvn clean package -DskipTests && cd ..
cd order-service && mvn clean package -DskipTests && cd ..
```

### Start Containers

```bash
docker-compose up --build
```

Useful variants:

```bash
docker-compose up
docker-compose down
docker-compose down -v
```

### Serve UI

```bash
python -m http.server 5500
```

Open:

```text
http://localhost:5500/app.html
```

### Check Runtime

```bash
docker ps
docker logs user-service --tail 30
docker logs product-service --tail 30
docker logs order-service --tail 30
docker logs api-gateway --tail 30
```

## Database Queries and Maintenance

### Connect

```bash
docker exec -it mysql mysql -u root -proot
```

### Inspect Data

```sql
USE user_db;
SELECT * FROM users;

USE product_db;
SELECT * FROM products;

USE order_db;
SELECT * FROM orders;
SELECT * FROM order_items;
```

### Reset Data

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
```

### Common Admin Operations

```sql
USE user_db;
DELETE FROM users WHERE id = 1;

USE product_db;
UPDATE products SET stock = 20 WHERE id = 1;
UPDATE products SET price = 75000 WHERE id = 1;
```

## Test Cases

Base URL: `http://localhost:8080`

### User Service

- TC-U1: valid registration.
- TC-U2: missing required field.
- TC-U3: fetch valid user.
- TC-U4: fetch invalid user.
- TC-U5: duplicate email.
- TC-U6: login by email.

### Product Service

- TC-P1: add product.
- TC-P2: reject negative price.
- TC-P3: list all products.
- TC-P4: fetch invalid product.
- TC-P5: valid stock reduction.
- TC-P6: reject excessive stock reduction.
- TC-P7: reject negative stock update.
- TC-P8: edit product.
- TC-P9: delete product.

### Order Service

- TC-O1: valid order flow.
- TC-O2: empty items rejected.
- TC-O3: invalid user.
- TC-O4: invalid product.
- TC-O5: zero quantity rejected.
- TC-O6: quantity exceeds stock.
- TC-O7: client price manipulation ignored.
- TC-O8: missing product ID rejected.
- TC-O9: get order by ID.
- TC-O10: get orders by user.
- TC-O11: quantity above allowed limit rejected.

### Integration and Failure

- TC-I1: complete flow (register -> add product -> order -> verify).
- TC-I2: multiple sequential orders.
- TC-I3: high quantity stress.
- TC-F1: service down behavior.
- TC-F2: database down behavior.
- TC-F3: gateway route misconfiguration behavior.

## Troubleshooting

- Old behavior after code changes: rebuild JARs before `docker-compose up --build`.
- Service cannot reach another service in Docker: replace `localhost` with container names.
- Stock mismatch: verify Product Service stock and order sequence.
- MySQL errors on startup: confirm `init.sql` created `user_db`, `product_db`, and `order_db`.
- Foreign key delete failure in `order_db`: delete `order_items` before `orders`.

## Terminology

- API Gateway: single external entry point that routes requests to services.
- CORS: browser policy for cross-origin requests; handled by gateway config.
- Microservices: independently deployable services with bounded responsibilities.
- Docker Compose: orchestration for multi-container local environments.
- RestTemplate: Spring HTTP client used for service-to-service calls.
- JPA/Hibernate: object-relational mapping and persistence engine.
- HikariCP: database connection pool.
- `@JsonManagedReference` and `@JsonBackReference`: prevent JSON recursion loops.
- `ddl-auto=update`: schema update mode for development.
- `CascadeType.ALL`: propagate persistence operations from parent to child entities.
- `ResponseEntity`: explicit HTTP status/body control in Spring controllers.

## Scope and Future Improvements

### Current Scope

- Focused on backend microservices architecture and containerized local execution.
- Excludes production-grade authentication, payments, and full frontend framework.

### Future Improvements

- JWT-based authentication and authorization.
- Payment simulation/integration.
- Observability (metrics, tracing, centralized logging).
- Service discovery and resilience patterns.
- Cloud deployment automation.

## License

This project is intended for learning and demonstration.