package com.suraj.coms.sales;

import com.suraj.coms.orders.OrderResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SalesController {

    private final SalesService salesService;

    public SalesController(SalesService salesService) {
        this.salesService = salesService;
    }

    @GetMapping("/orders")
    public List<OrderResponse> getOrders() {
        return salesService.getOrders();
    }

    @GetMapping("/metrics")
    public SalesMetricsResponse getMetrics() {
        return salesService.getMetrics();
    }
}
