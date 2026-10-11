package com.suraj.coms.sales;

import java.math.BigDecimal;

public record SalesMetricsResponse(
        BigDecimal today,
        BigDecimal week,
        BigDecimal month,
        BigDecimal year
) {
}
