package com.suraj.coms.orders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        String tableNumber,
        String orderType,
        String status,
        BigDecimal subtotal,
        BigDecimal total,
        LocalDateTime createdAt,
        List<OrderItemResponse> items
) {
}
