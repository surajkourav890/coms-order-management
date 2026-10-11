package com.suraj.coms.orders;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long menuItemId,
        String name,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
