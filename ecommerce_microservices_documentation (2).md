# 01_overview.md

# Dockerized Microservices-Based E-Commerce Backend with API Gateway

## 1. Introduction

This project is a backend system for an e-commerce platform built using a microservices architecture. The system is designed to demonstrate how real-world distributed backend systems operate using multiple independent services that communicate with each other.

The entire system is containerized using Docker and exposed through a single entry point called the API Gateway.

---

## 2. Objective

The main objective of this project is to:

- Build a scalable backend using microservices
- Separate business logic into independent services
- Implement inter-service communication using REST APIs
- Manage data using separate databases for each service
- Deploy the system using Docker
- Provide a unified entry point using an API Gateway

---

## 3. Problem Statement

Traditional monolithic applications combine all functionalities into a single codebase, which makes them difficult to scale, maintain, and update.

This project solves that problem by:

- Dividing the application into smaller services
- Allowing each service to run independently
- Enabling better scalability and maintainability

---

## 4. Key Features

The system provides the following functionalities:

- User registration and retrieval
- Product creation, listing, and deletion
- Inventory (stock) management
- Order placement and order history tracking
- Automatic stock reduction after order placement
- Centralized API access using API Gateway

---

## 5. Technologies Used

### Backend
- Spring Boot
- Spring Data JPA
- REST APIs

### Database
- MySQL

### Architecture
- Microservices Architecture
- API Gateway

### Deployment
- Docker
- Docker Compose

### Development Tools
- IntelliJ IDEA
- Postman

### Frontend (Optional)
- HTML
- JavaScript

---

## 6. System Overview

The system consists of multiple services:

- User Service → manages user data
- Product Service → manages product catalog and stock
- Order Service → processes orders and coordinates between services
- API Gateway → routes all incoming requests

Each service has its own database and operates independently.

---

## 7. High-Level Workflow

1. The client (UI or Postman) sends requests to the API Gateway.
2. The API Gateway routes the request to the appropriate microservice.
3. The microservice processes the request.
4. If required, it communicates with other services.
5. Data is stored or retrieved from MySQL.
6. The response is sent back through the API Gateway.

---

## 8. Expected Outcome

At the end of this project, the system will:

- Successfully demonstrate a working microservices backend
- Handle user, product, and order operations
- Maintain data consistency across services
- Run fully inside Docker containers
- Be accessible through a single API Gateway

---

## 9. Scope

This project focuses only on backend development and system architecture.

It does NOT include:

- Full production-level authentication
- Payment gateway integration
- Advanced frontend frameworks

The goal is to demonstrate core backend and microservices concepts effectively.

---

## 10. Conclusion of Overview

This project serves as a strong foundation for understanding how modern backend systems are designed and deployed using microservices and containerization.

It reflects real-world practices and prepares the system for future enhancements such as authentication, scaling, and cloud deployment.

# 02_architecture.md

# System Architecture

## 1. Introduction

This document explains the architecture of the Dockerized Microservices-Based E-Commerce Backend system. The system follows a distributed microservices architecture where each service is independent and communicates through REST APIs.

---

## 2. Architectural Style

The project uses:

- Microservices Architecture
- API Gateway Pattern
- Database per Service Pattern

This ensures:

- Loose coupling
- High scalability
- Independent deployment

---

## 3. High-Level Architecture Diagram

```text
        Browser / Postman / UI
                  ↓
         API Gateway (8080)
                  ↓
   ---------------------------------
   ↓               ↓               ↓
User Service   Product Service   Order Service
   ↓               ↓               ↓
   ----------- MySQL Database -----------
```

---

## 4. Core Components

### 4.1 API Gateway

The API Gateway acts as the single entry point for all external requests.

Responsibilities:

- Route requests to correct service
- Hide internal service details
- Simplify client interaction

Routing:

- `/users/**` → User Service
- `/products/**` → Product Service
- `/orders/**` → Order Service

---

### 4.2 User Service

Handles all user-related operations.

Responsibilities:

- Register user
- Fetch user details

Database:

- `user_db`

---

### 4.3 Product Service

Handles product and inventory.

Responsibilities:

- Add product
- View products
- Delete product
- Manage stock

Database:

- `product_db`

---

### 4.4 Order Service

Handles order processing and inter-service communication.

Responsibilities:

- Validate user via User Service
- Fetch product details via Product Service
- Calculate total amount
- Reduce stock
- Save order

Database:

- `order_db`

---

### 4.5 MySQL Database

A centralized MySQL container is used, but logically each service uses its own database.

Databases:

- `user_db`
- `product_db`
- `order_db`

---

## 5. Service Communication

### 5.1 External Communication

Clients communicate only with the API Gateway:

```text
http://localhost:8080
```

---

### 5.2 Internal Communication (Docker Network)

Inside Docker, services communicate using service names:

- `http://user-service:8081`
- `http://product-service:8082`
- `http://order-service:8083`

Important:

- `localhost` is NOT used inside containers
- Each service is isolated

---

## 6. Request Flow Example (Order Placement)

```text
UI → API Gateway → Order Service
                  ↓
         User Service (validation)
                  ↓
        Product Service (price + stock)
                  ↓
          Order Service (processing)
                  ↓
               MySQL
```

Steps:

1. User places order from UI.
2. Request goes to API Gateway.
3. Gateway routes to Order Service.
4. Order Service validates user.
5. Order Service fetches product details.
6. Order Service calculates total.
7. Order Service reduces stock.
8. Order is saved in database.
9. Response returned to client.

---

## 7. Key Architectural Decisions

### 7.1 API Gateway Usage

Why used:

- Simplifies client interaction
- Centralizes routing
- Improves maintainability

---

### 7.2 Database per Service

Why used:

- Data isolation
- Independent scaling
- Avoids tight coupling

---

### 7.3 Server-Side Business Logic

Important rule:

- Price is NOT taken from UI
- Stock validation is server-controlled

This ensures security and correctness.

---

### 7.4 Docker Networking

Instead of localhost, services use container names.

This enables:

- Service discovery
- Reliable communication

---

## 8. Advantages of This Architecture

- Scalable
- Maintainable
- Fault isolation
- Real-world design pattern
- Easy to extend

---

## 9. Limitations (Current Scope)

- No authentication system
- No load balancing
- No service registry
- No distributed transactions

These can be added in future.

---

## 10. Conclusion

The system architecture demonstrates how modern backend systems are structured using microservices, API Gateway, and containerization. It provides a strong foundation for building scalable and production-ready applications.

# 03_project_structure.md

# Project Structure

## 1. Introduction

This document describes the complete folder and file structure of the E-Commerce Microservices project. Understanding the structure is important to know how different components are organized and how they interact with each other.

---

## 2. Root Directory Structure

```text
ecommerce-project/
├── api-gateway/
├── user-service/
├── product-service/
├── order-service/
├── docker-compose.yml
├── init.sql
├── app.html (UI file)
```

---

## 3. Explanation of Each Component

### 3.1 api-gateway/

Contains the API Gateway service.

Purpose:

- Acts as entry point for all client requests
- Routes requests to respective microservices
- Handles CORS configuration for UI

Key files:

- `ApiGatewayApplication.java` → main entry point
- `application.properties` → routing configuration
- `CorsConfig.java` → allows UI communication

---

### 3.2 user-service/

Handles user-related operations.

Structure:

```text
user-service/
└── src/main/java/com/ecommerce/userservice/
    ├── controller/
    ├── service/
    ├── entity/
    ├── repository/
    └── UserServiceApplication.java
```

Purpose:

- Register user
- Fetch user data

---

### 3.3 product-service/

Handles product and inventory.

Structure:

```text
product-service/
└── src/main/java/com/ecommerce/productservice/
    ├── controller/
    ├── service/
    ├── entity/
    ├── repository/
    └── ProductServiceApplication.java
```

Purpose:

- Add product
- View products
- Delete product
- Manage stock

---

### 3.4 order-service/

Handles order processing.

Structure:

```text
order-service/
└── src/main/java/com/ecommerce/orderservice/
    ├── controller/
    ├── service/
    ├── entity/
    ├── repository/
    └── OrderServiceApplication.java
```

Purpose:

- Place orders
- Validate users and products
- Calculate total amount
- Reduce product stock

---

### 3.5 docker-compose.yml

Located in root directory.

Purpose:

- Defines all containers
- Connects services together
- Starts MySQL and all microservices

Services defined:

- mysql
- user-service
- product-service
- order-service
- api-gateway

---

### 3.6 init.sql

Purpose:

- Automatically creates required databases

```sql
CREATE DATABASE user_db;
CREATE DATABASE product_db;
CREATE DATABASE order_db;
```

---

### 3.7 UI File (app.html)

Purpose:

- Acts as frontend interface
- Calls API Gateway endpoints
- Displays products, users, orders

Important:

- UI is NOT part of Docker
- UI runs in browser
- UI communicates via API Gateway

---

## 4. Internal Structure of Each Service

Each microservice follows a layered architecture:

```text
controller → service → repository → database
```

### 4.1 Controller Layer

- Handles HTTP requests
- Defines API endpoints

### 4.2 Service Layer

- Contains business logic
- Handles processing and validation

### 4.3 Repository Layer

- Interacts with database
- Uses Spring Data JPA

### 4.4 Entity Layer

- Represents database tables

---

## 5. Build Output Structure

After running Maven build:

```text
target/
└── service-name-0.0.1-SNAPSHOT.jar
```

This JAR file is used by Docker to run the service.

---

## 6. Docker File Placement

Each service contains a Dockerfile:

```text
service-name/
└── Dockerfile
```

Purpose:

- Copies built JAR
- Runs application inside container

---

## 7. How Everything Connects

```text
UI (app.html)
     ↓
API Gateway (8080)
     ↓
Microservices (Docker containers)
     ↓
MySQL Database
```

---

## 8. Important Notes

- Each service is independent
- Each service has its own database
- Services communicate via REST
- Docker connects all services via network
- UI communicates only with API Gateway

---

## 9. Conclusion

The project structure is modular and follows best practices for microservices. Each component has a clear responsibility, making the system easy to understand, maintain, and extend.



---

# 04_services_explained.md

## 1. Overview

Each microservice in this project has a single responsibility and its own database. Services communicate via REST over the Docker network. This section details responsibilities, data model intent, endpoints, and internal flow for each service.

---

## 2. User Service

### Purpose

Manages user data and provides basic validation for order processing.

### Database

- `user_db`
- Table: `users`
  - `id (PK)`
  - `name`
  - `email`
  - `password`

### Endpoints

- `POST /users/register` → create user
- `GET /users/{id}` → fetch user

### Flow

1. Receive request in Controller
2. Validate payload (non-null fields)
3. Persist using Repository (JPA)
4. Return saved entity

### Notes

- No authentication layer (out of scope)
- Email uniqueness can be enforced as an enhancement

---

## 3. Product Service

### Purpose

Manages product catalog and inventory (stock). It is the **source of truth** for price and stock.

### Database

- `product_db`
- Table: `products`
  - `id (PK)`
  - `name`
  - `description`
  - `price`
  - `stock`

### Endpoints

- `POST /products`
- `GET /products`
- `GET /products/{id}`
- `DELETE /products/{id}`
- `PUT /products/reduce/{id}?quantity=x` (internal)

### Flow (Reduce Stock)

1. Fetch product by ID
2. Validate `stock >= quantity`
3. Update `stock = stock - quantity`
4. Save entity

### Notes

- Price is authoritative here; never trust UI price
- Update endpoint can be added for editing price/stock

---

## 4. Order Service

### Purpose

Coordinates the order lifecycle and enforces business rules by interacting with User and Product services.

### Database

- `order_db`
- Tables:
  - `orders` (id, user_id, total_amount, status)
  - `order_items` (id, product_id, quantity, price, order_id)

### Endpoints

- `POST /orders`
- `GET /orders/{id}`
- `GET /orders/user/{userId}`

### Detailed Flow (Place Order)

1. Validate request (userId, productId, items not empty)
2. Call User Service: `GET /users/{id}`
3. For each item (single loop — validate and reduce together):
   - Call Product Service: `GET /products/{id}`
   - Read `price`, `stock`
   - Validate `quantity > 0` and `quantity <= stock`
   - Set item.price from Product Service
   - Accumulate total
   - Call Product Service reduce API to decrement stock
   - Bind item to order (JPA relationship)
4. Set `totalAmount`, `status=PLACED`
5. Persist order with cascade (items saved with order)
6. Return response

Important: Validation and stock reduction happen in the same loop per item.
This prevents stock leaks when the same product appears multiple times in one order.

### Notes

- Uses `RestTemplate` for inter-service calls
- Must use service names (not localhost) in Docker
- Handles all critical validations

---

## 5. API Gateway

### Purpose

Acts as the single entry point and router for all external traffic.

### Configuration

Routes (in `application.properties`):

- `/users/**` → `http://user-service:8081`
- `/products/**` → `http://product-service:8082`
- `/orders/**` → `http://order-service:8083`

### Responsibilities

- Centralized routing
- Hides internal topology
- Enables UI to use a single base URL
- Handles CORS for browser clients

### Notes

- No business logic
- Can be extended with filters (auth, logging)

---

# 05_intellij_development.md

## 1. Project Creation

Each microservice was created as a separate Spring Boot project in IntelliJ with Java 17.

Dependencies used:

- Spring Web
- Spring Data JPA
- MySQL Driver

---

## 2. Standard Package Structure

```text
com.ecommerce.<service>/
├── controller
├── service
├── repository
├── entity
└── <Application>.java
```

---

## 3. Layer Responsibilities

### Controller
- Maps HTTP endpoints
- Validates request shape
- Returns HTTP responses

### Service
- Contains business logic
- Coordinates with other services

### Repository
- Extends JPA interfaces
- Performs CRUD operations

### Entity
- Maps to database tables
- Defines relationships (e.g., Order ↔ OrderItem)

---

## 4. Configuration

Each service has `application.properties` with:

- `server.port`
- `spring.datasource.url` (uses `mysql` host in Docker)
- `spring.jpa.hibernate.ddl-auto=update`
- `spring.jpa.show-sql=true`

---

## 5. Key Fixes Implemented

- Added request validation in controllers (null/empty checks)
- Added `productId` null validation in order request
- Prevented negative/zero quantities
- Fixed JSON recursion using proper entity mapping (avoid infinite nesting)
- Moved price calculation to Order Service using Product Service data
- Merged validation and stock reduction into a single loop to prevent stock leaks
- Replaced `localhost` with Docker service names
- Added duplicate email handling in user registration
- Added negative stock prevention in manual stock update

---

## 6. Build Process (Maven)

For each service:

```bash
mvn clean package -DskipTests
```

Output:

```text
target/<service>-0.0.1-SNAPSHOT.jar
```

This JAR is used by Docker to run the application.

---

# 06_api_documentation.md

## 1. Base URL

```text
http://localhost:8080
```

All client calls must go through the API Gateway.

---

## 2. User APIs

### Register User

```text
POST /users/register
```

Request:

```json
{
  "name": "Rishabh",
  "email": "rishabh@gmail.com",
  "password": "1234"
}
```

Response (200):

```json
{
  "id": 1,
  "name": "Rishabh",
  "email": "rishabh@gmail.com"
}
```

---

### Get User

```text
GET /users/{id}
```

Response (200): user object or 404 if not found

---

## 3. Product APIs

### Add Product

```text
POST /products
```

Request:

```json
{
  "name": "Laptop",
  "description": "Gaming laptop",
  "price": 80000,
  "stock": 10
}
```

Response: created product with `id`

---

### List Products

```text
GET /products
```

Response:

```json
[
  { "id": 1, "name": "Laptop", "price": 80000, "stock": 10 }
]
```

---

### Get Product

```text
GET /products/{id}
```

---

### Delete Product

```text
DELETE /products/{id}
```

---

### Reduce Stock (internal)

```text
PUT /products/reduce/{id}?quantity=2
```

Response: updated product

---

## 4. Order APIs

### Place Order

```text
POST /orders
```

Request:

```json
{
  "userId": 1,
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

Response (200):

```json
{
  "id": 101,
  "userId": 1,
  "totalAmount": 160000,
  "status": "PLACED",
  "items": [
    { "productId": 1, "quantity": 2, "price": 80000 }
  ]
}
```

Errors (examples):

- 400: invalid quantity / empty items
- 500: insufficient stock / user or product not found

---

### Get Order by ID

```text
GET /orders/{id}
```

---

### Get Orders by User

```text
GET /orders/user/{userId}
```

Response: list of orders for the user

---

## 5. Conventions

- JSON request/response
- Gateway-first access (no direct service calls from UI)
- Server controls price and stock


## Setup per service
- Created Spring Boot apps (Java 17)
- Packages: `controller`, `service`, `entity`, `repository`
- Added dependencies: Web, JPA, MySQL
- Configured `application.properties` with DB URL and port

## Layers
- Controller: REST endpoints
- Service: business logic
- Repository: JPA access
- Entity: tables/relations

## Fixes implemented
- Request body validation (null/empty)
- Quantity > 0 checks
- ProductId null check in order items
- Prevent negative totals
- Break JSON recursion between Order ↔ OrderItem
- Move price calculation to server (from Product Service)
- Single-loop validation and stock reduction to prevent stock leaks
- Replace `localhost` with service names for Docker
- Duplicate email returns clean error instead of 500
- Manual stock update rejects negative values

---

# 06_api_documentation.md

## Base URL
`http://localhost:8080`

## Users
- POST `/users/register`
  ```json
  { "name":"Rishabh", "email":"rishabh@gmail.com", "password":"1234" }
  ```
- GET `/users/{id}`

## Products
- POST `/products`
  ```json
  { "name":"Laptop", "description":"Gaming", "price":80000, "stock":10 }
  ```
- GET `/products`
- GET `/products/{id}`
- PUT `/products/{id}` (full product update)
- DELETE `/products/{id}`
- PUT `/products/reduce/{id}?quantity=2` (internal use)

## Orders
- POST `/orders`
  ```json
  { "userId":1, "items":[{"productId":1,"quantity":2}] }
  ```
- GET `/orders/{id}`
- GET `/orders/user/{userId}`

---

# 07_business_logic_flow.md

## User Flow
1. Register → receive `userId`

## Product Flow
1. Add product
2. List products

## Order Flow (core)
1. UI sends order → Gateway → Order Service
2. Validate request (userId, productId not null, items not empty)
3. Validate user (User Service)
4. For each item (single loop):
   - Fetch product (Product Service)
   - Compute price and validate stock
   - Reduce stock immediately (Product Service)
5. Save order (Order DB)
6. Return response

## Rules
- Price is NOT accepted from UI
- Quantity must be > 0 and ≤ stock
- Stock updated only by Product Service
- ProductId is required for each order item
- Duplicate email registration returns a clean error
- Manual stock update rejects negative values

---

# 08_docker_setup.md

## docker-compose.yml (roles)
- mysql (3306 inside, exposed as needed)
- user-service (8081)
- product-service (8082)
- order-service (8083)
- api-gateway (8080)

## Dockerfile (per service)
```dockerfile
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY target/*.jar app.jar
ENTRYPOINT ["java","-jar","app.jar"]
```

## Networking (critical)
- Use service names inside containers:
  - `http://user-service:8081`
  - `http://product-service:8082`
- Do NOT use `localhost` for inter-service calls

## Build & Run
- Build JARs (each service): `mvn clean package -DskipTests`
- Start: `docker-compose up --build`
- Restart (no code change): `docker-compose up`

## Common Issues
- Old behavior after code change → JAR not rebuilt
- Connection refused → using `localhost` inside Docker
- DB errors → ensure `init.sql` created databases

---

# 09_testing_and_debugging.md

(See separate file: 09_test_cases.md for complete test suite)

---

# 09_test_cases.md

# Complete Test Cases Documentation (Standalone)

## 1. Purpose

This document contains every possible test case discussed and implemented during development. It ensures full validation of:

- Business logic correctness
- API behavior
- Data consistency
- Service integration
- Security against bad inputs

---

## 2. Global Testing Rules

- Always use API Gateway → `http://localhost:8080`
- Do NOT call services directly
- Do NOT send price in order payload
- Always validate responses

---

## 3. User Service Test Cases

### TC-U1: Valid Registration
```json
{
  "name": "Test User",
  "email": "test@gmail.com",
  "password": "1234"
}
```
Expected: 200 OK, user created

---

### TC-U2: Missing Email
```json
{
  "name": "Test"
}
```
Expected: Error

---

### TC-U3: Fetch Valid User
GET `/users/1`
Expected: User object

---

### TC-U4: Fetch Invalid User
GET `/users/999`
Expected: Error / null

---

## 4. Product Service Test Cases

### TC-P1: Add Product
```json
{
  "name": "Laptop",
  "description": "Gaming",
  "price": 80000,
  "stock": 10
}
```
Expected: Created

---

### TC-P2: Negative Price
```json
{
  "name": "Laptop",
  "price": -100,
  "stock": 10
}
```
Expected: Error

---

### TC-P3: Get Products
GET `/products`
Expected: List

---

### TC-P4: Get Invalid Product
GET `/products/999`
Expected: Error

---

### TC-P5: Reduce Stock Valid
PUT `/products/reduce/1?quantity=2`
Expected: Stock decreases

---

### TC-P6: Reduce Stock Invalid
PUT `/products/reduce/1?quantity=999`
Expected: Error

---

## 5. Order Service Test Cases

### TC-O1: Valid Order
```json
{
  "userId": 1,
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```
Expected: Order created, stock reduced

---

### TC-O2: No Items
```json
{
  "userId": 1,
  "items": []
}
```
Expected: Error

---

### TC-O3: Invalid User
```json
{
  "userId": 999,
  "items": [{ "productId": 1, "quantity": 2 }]
}
```
Expected: Error

---

### TC-O4: Invalid Product
```json
{
  "userId": 1,
  "items": [{ "productId": 999, "quantity": 2 }]
}
```
Expected: Error

---

### TC-O5: Zero Quantity
```json
{
  "userId": 1,
  "items": [{ "productId": 1, "quantity": 0 }]
}
```
Expected: Error

---

### TC-O6: Negative Quantity
```json
{
  "userId": 1,
  "items": [{ "productId": 1, "quantity": -2 }]
}
```
Expected: Error

---

### TC-O7: Quantity > Stock
```json
{
  "userId": 1,
  "items": [{ "productId": 1, "quantity": 1000 }]
}
```
Expected: Error

---

### TC-O8: Price Manipulation Attempt
```json
{
  "userId": 1,
  "items": [
    { "productId": 1, "quantity": 2, "price": 1 }
  ]
}
```
Expected: Ignored, real price used

---

### TC-O9: Get Order
GET `/orders/1`
Expected: Order

---

### TC-O10: Get Orders by User
GET `/orders/user/1`
Expected: List

---

### TC-O11: Missing Product ID
```json
{
  "userId": 1,
  "items": [{ "quantity": 2 }]
}
```
Expected: 400 Bad Request — "Product ID is required"

---

### TC-O12: Duplicate Product ID (stock leak prevention)
```json
{
  "userId": 1,
  "items": [
    { "productId": 1, "quantity": 3 },
    { "productId": 1, "quantity": 3 }
  ]
}
```
Expected: Second item fails if combined quantity exceeds stock. No stock leak.

---

### TC-U5: Duplicate Email Registration
```json
{ "name": "Test", "email": "existing@gmail.com", "password": "1234" }
```
Expected: Error — "Email already exists"

---

### TC-P7: Set Negative Stock
PUT `/products/updateStock/1?stock=-10`
Expected: Error — "Stock cannot be negative"

---

## 6. Integration Flow Test

### TC-I1: Complete Flow
1. Register user
2. Add product
3. Place order
4. Check stock
5. Fetch order

Expected: Fully working

---

### TC-I2: Multiple Orders
Expected: Stock reduces sequentially

---

### TC-I3: High Quantity Stress
Expected: No negative stock

---

## 7. UI Synchronization Tests

### TC-UI1
Add product via UI → visible in Postman

### TC-UI2
Order via UI → visible in DB

### TC-UI3
Order via Postman → visible in UI

---

## 8. Failure Tests

### TC-F1: Service Down
Expected: Order fails

### TC-F2: DB Down
Expected: Services crash

### TC-F3: Gateway Misconfig
Expected: 404

---

## 9. Final Validation Checklist

- [ ] All endpoints working
- [ ] Stock updates correctly
- [ ] No negative values allowed
- [ ] Price controlled by backend
- [ ] Gateway routing works
- [ ] Docker services stable

---

# 10_ui_integration.md

## Overview
The single-page `app.html` provides a complete frontend for all three services, connecting via the API Gateway (`http://localhost:8080`).

## UI Tabs & Roles
1. **Register**: Creates a new user in the User Service.
2. **Login**: Authenticates against stored credentials and grants User access.
3. **Admin**: Authenticates via static password (`admin123`) to grant Admin access.

## Features & Flow

### User View
- **Products**: Auto-fetches from catalog.
- **Dynamic Cart**: 
  - Tracks available inventory (Stock - Qtys already in cart).
  - Validates requested quantity against available stock before adding.
  - "Add" button gracefully disables to "Out of Stock" or "All in cart".
- **Cart Tracking**: Maintained securely in frontend state. Prices are strictly indicative; the backend computes authoritative totals.
- **My Orders**: Fetches the user's order history and statuses.

### Admin View
- **Manage Products**: Full CRUD (Create, Read, Update, Delete) capability.
- **Edit Panel**: Utilizes the `PUT /products/{id}` endpoint to adjust names, descriptions, prices, and stock levels.

## Synchronization
- The UI maintains parity with DB state (and changes introduced via Postman or other platforms) through aggressive polling:
```js
setInterval(() => {
    loadProducts();
    if(userId) loadOrders(); // For logged in users
}, 3000);
```

## Serve UI
```bash
python -m http.server 5500
# open http://localhost:5500/app.html
```

---

# 11_run_guide.md

## Start (no rebuild)
```bash
docker-compose up
```

## Start UI
```bash
python -m http.server 5500
```

## Rebuild (after code changes)
```bash
# in each service
mvn clean package -DskipTests
# then
docker-compose up --build
```

## Stop
```bash
docker-compose down
```
## Database under Docker
```bash
docker exec -it mysql mysql -u root -proot
```
## Database commands
```bash
SHOW DATABASES;
USE product_db;
SELECT * FROM products;
USE order_db;
SELECT * FROM orders;
```
---

# 12_final_summary.md

## Achievements
- Microservices (User, Product, Order)
- API Gateway routing
- Separate DB per service
- Dockerized deployment
- End-to-end order flow with stock control

## Learnings
- Service-to-service communication
- Docker networking (no localhost)
- Server-side validation and business logic

## Future Work
- Authentication (login/JWT)
- Product update API
- Better UI (React)
- Payment simulation
- Cloud deployment

