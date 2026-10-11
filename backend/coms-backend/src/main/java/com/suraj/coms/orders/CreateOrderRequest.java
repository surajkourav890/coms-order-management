package com.suraj.coms.orders;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
        @NotBlank @Size(max = 30) String tableNumber,
        @NotBlank @Pattern(regexp = "DINE_IN|TAKEAWAY") String orderType,
        @NotEmpty @Valid List<CreateOrderItemRequest> items,
        BigDecimal subtotal,
        BigDecimal total,
        String currency,
        String status
) {
}
