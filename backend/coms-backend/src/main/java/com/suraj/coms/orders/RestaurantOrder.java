package com.suraj.coms.orders;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_orders")
public class RestaurantOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 30)
    private String orderNumber;

    @Column(name = "table_number", nullable = false, length = 30)
    private String tableNumber;

    @Column(name = "order_type", nullable = false, length = 20)
    private String orderType;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected RestaurantOrder() {
        // JPA needs a no-argument constructor to load rows from MySQL.
    }

    public RestaurantOrder(String orderNumber, String tableNumber, String orderType,
                           String status, BigDecimal subtotal, BigDecimal totalAmount,
                           LocalDateTime createdAt) {
        this.orderNumber = orderNumber;
        this.tableNumber = tableNumber;
        this.orderType = orderType;
        this.status = status;
        this.subtotal = subtotal;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public String getTableNumber() {
        return tableNumber;
    }

    public String getOrderType() {
        return orderType;
    }

    public String getStatus() {
        return status;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
