package com.suraj.coms.orders;

import com.suraj.coms.menu.MenuItem;
import com.suraj.coms.menu.MenuItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuItemRepository menuItemRepository;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        MenuItemRepository menuItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.menuItemRepository = menuItemRepository;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        List<PricedOrderItem> pricedItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        for (CreateOrderItemRequest requestedItem : request.items()) {
            MenuItem menuItem = menuItemRepository.findById(requestedItem.menuItemId())
                    .filter(MenuItem::isAvailable)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Menu item " + requestedItem.menuItemId() + " is unavailable"
                    ));

            BigDecimal unitPrice = menuItem.getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(requestedItem.quantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineTotal);
            pricedItems.add(new PricedOrderItem(menuItem, requestedItem.quantity(), unitPrice, lineTotal));
        }

        LocalDateTime createdAt = LocalDateTime.now();
        RestaurantOrder order = orderRepository.save(new RestaurantOrder(
                newOrderNumber(),
                request.tableNumber().trim(),
                request.orderType(),
                "PLACED",
                subtotal,
                subtotal,
                createdAt
        ));

        List<OrderItem> savedItems = pricedItems.stream()
                .map(item -> new OrderItem(
                        order.getId(),
                        item.menuItem().getId(),
                        item.menuItem().getName(),
                        item.unitPrice(),
                        item.quantity(),
                        item.lineTotal()
                ))
                .toList();
        orderItemRepository.saveAll(savedItems);

        List<OrderItemResponse> responseItems = pricedItems.stream()
                .map(item -> new OrderItemResponse(
                        item.menuItem().getId(),
                        item.menuItem().getName(),
                        item.quantity(),
                        item.unitPrice(),
                        item.lineTotal()
                ))
                .toList();

        return toResponse(order, responseItems);
    }

    private String newOrderNumber() {
        String suffix = UUID.randomUUID().toString().replace("-", "")
                .substring(0, 16).toUpperCase(Locale.ROOT);
        return "ORD-" + suffix;
    }

    public static OrderResponse toResponse(RestaurantOrder order, List<OrderItemResponse> items) {
        return new OrderResponse(
                order.getId(), order.getOrderNumber(), order.getTableNumber(),
                order.getOrderType(), order.getStatus(), order.getSubtotal(),
                order.getTotalAmount(), order.getCreatedAt(), items
        );
    }

    private record PricedOrderItem(MenuItem menuItem, int quantity,
                                   BigDecimal unitPrice, BigDecimal lineTotal) {
    }
}
