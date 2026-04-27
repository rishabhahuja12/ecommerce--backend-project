package com.ecommerce.orderservice.service;

import com.ecommerce.orderservice.entity.Order;
import com.ecommerce.orderservice.entity.OrderItem;
import com.ecommerce.orderservice.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final RestTemplate restTemplate;

    public OrderService(OrderRepository orderRepository, RestTemplate restTemplate) {
        this.orderRepository = orderRepository;
        this.restTemplate = restTemplate;
    }

    public Order placeOrder(Order order) {

        double total = 0;

        String userUrl = "http://user-service:8081/users/" + order.getUserId();
        Object user = restTemplate.getForObject(userUrl, Object.class);

        if (user == null) {
            throw new RuntimeException("User not found");
        }

        for (OrderItem item : order.getItems()) {

            String productUrl = "http://product-service:8082/products/" + item.getProductId();
            Map product = restTemplate.getForObject(productUrl, Map.class);

            if (product == null) {
                throw new RuntimeException("Product not found");
            }

            double price = Double.parseDouble(product.get("price").toString());
            int stock = Integer.parseInt(product.get("stock").toString());

            if (item.getQuantity() > stock) {
                throw new RuntimeException("Insufficient stock");
            }

            item.setPrice(price);
            total += price * item.getQuantity();

            String reduceUrl = "http://product-service:8082/products/reduce/"
                    + item.getProductId() + "?quantity=" + item.getQuantity();

            restTemplate.put(reduceUrl, null);

            item.setOrder(order);
        }

        order.setTotalAmount(total);
        order.setStatus("PLACED");

        return orderRepository.save(order);
    }

    public Order getOrder(Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    public List<Order> getOrdersByUser(Long userId) {
        return orderRepository.findByUserId(userId);
    }
}