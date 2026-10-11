package com.suraj.coms.orders;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<RestaurantOrder, Long> {

    List<RestaurantOrder> findAllByOrderByCreatedAtDesc();

    @Query("select sum(o.totalAmount) from RestaurantOrder o "
            + "where o.createdAt >= :start and o.createdAt < :end")
    BigDecimal sumTotalBetween(@Param("start") LocalDateTime start,
                               @Param("end") LocalDateTime end);
}
