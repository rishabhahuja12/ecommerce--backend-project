# E-Commerce Microservices Backend

Dockerized microservices-based e-commerce backend built with Spring Boot, MySQL, and an API Gateway.

## Overview

This project demonstrates a distributed backend system with independently deployable services:

- User Service: user registration and retrieval
- Product Service: product catalog and inventory management
- Order Service: order placement and order history
- API Gateway: single entry point for all client traffic

All services run in Docker containers and communicate over a shared Docker network.

## Tech Stack

- Java 17
- Spring Boot (Web, Data JPA)
- MySQL
- Docker and Docker Compose
- Maven

## Service Ports

- API Gateway: `8080`
- User Service: `8081`
- Product Service: `8082`
- Order Service: `8083`
- MySQL: `3307` (host) -> `3306` (container)

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
|- PROJECT_GUIDE.md
|- ecommerce_microservices_documentation (2).md
```

## Prerequisites

- Java 17
- Maven
- Docker Desktop
- Python 3 (optional, to serve local UI)

## Quick Start

1. Build all microservices JARs:

```bash
cd api-gateway && mvn clean package -DskipTests && cd ..
cd user-service && mvn clean package -DskipTests && cd ..
cd product-service && mvn clean package -DskipTests && cd ..
cd order-service && mvn clean package -DskipTests && cd ..
```

2. Start containers:

```bash
docker-compose up --build
```

3. (Optional) Run frontend locally:

```bash
python -m http.server 5500
```

Open `http://localhost:5500/app.html`

## API Access

Base URL:

```text
http://localhost:8080
```

Gateway routing:

- `/users/**` -> User Service
- `/products/**` -> Product Service
- `/orders/**` -> Order Service

## Important Notes

- UI should call only the API Gateway (`http://localhost:8080`).
- Inter-service calls inside Docker must use container names, not `localhost`.
- Product pricing is server-controlled in Order Service flow.
- Build service JARs again after Java code changes before `docker-compose up --build`.

## Documentation

- `PROJECT_GUIDE.md`: startup guide, test cases, SQL queries, and glossary
- `ecommerce_microservices_documentation (2).md`: complete architecture and workflow documentation

## License

This project is for learning and demonstration purposes.