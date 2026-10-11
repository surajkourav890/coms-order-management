package com.suraj.coms.sales;

import com.suraj.coms.orders.OrderItem;
import com.suraj.coms.orders.OrderItemRepository;
import com.suraj.coms.orders.OrderItemResponse;
import com.suraj.coms.orders.OrderRepository;
import com.suraj.coms.orders.OrderResponse;
import com.suraj.coms.orders.OrderService;
import com.suraj.coms.orders.RestaurantOrder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SalesService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public SalesService(OrderRepository orderRepository, OrderItemRepository orderItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders() {
        List<RestaurantOrder> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        if (orders.isEmpty()) return List.of();

        List<Long> orderIds = orders.stream().map(RestaurantOrder::getId).toList();
        Map<Long, List<OrderItemResponse>> itemsByOrderId = orderItemRepository.findByOrderIdIn(orderIds)
                .stream()
                .collect(Collectors.groupingBy(
                        OrderItem::getOrderId,
                        Collectors.mapping(SalesService::toItemResponse, Collectors.toList())
                ));

        return orders.stream()
                .map(order -> OrderService.toResponse(
                        order,
                        itemsByOrderId.getOrDefault(order.getId(), List.of())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public SalesMetricsResponse getMetrics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate yearStart = today.withDayOfYear(1);

        return new SalesMetricsResponse(
                sumSince(today.atStartOfDay(), now),
                sumSince(weekStart.atStartOfDay(), now),
                sumSince(monthStart.atStartOfDay(), now),
                sumSince(yearStart.atStartOfDay(), now)
        );
    }

    private BigDecimal sumSince(LocalDateTime start, LocalDateTime end) {
        BigDecimal total = orderRepository.sumTotalBetween(start, end.plusNanos(1));
        return total == null ? BigDecimal.ZERO.setScale(2) : total;
    }

    private static OrderItemResponse toItemResponse(OrderItem item) {
        return new OrderItemResponse(
                item.getMenuItemId(), item.getItemName(), item.getQuantity(),
                item.getUnitPrice(), item.getLineTotal()
        );
    }
}
