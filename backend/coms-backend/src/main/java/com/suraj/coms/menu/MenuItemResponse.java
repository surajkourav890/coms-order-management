package com.suraj.coms.menu;

import java.math.BigDecimal;

public record MenuItemResponse(
        Long id,
        String name,
        String category,
        BigDecimal price
) {
}
