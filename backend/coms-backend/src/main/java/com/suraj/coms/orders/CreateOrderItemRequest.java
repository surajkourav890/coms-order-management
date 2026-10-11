package com.suraj.coms.orders;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CreateOrderItemRequest(
        @NotNull @Positive Long menuItemId,
        String name,
        @NotNull @Positive Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
