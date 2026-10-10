package com.ares3dstudio.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OrderStatusSchemaMigration {
    private static final Logger logger = LoggerFactory.getLogger(OrderStatusSchemaMigration.class);
    private final JdbcTemplate jdbcTemplate;

    public OrderStatusSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void allowCancelledOrderStatus() {
        try {
            List<String> constraints = jdbcTemplate.queryForList("""
                SELECT conname
                FROM pg_constraint
                WHERE conrelid = 'orders'::regclass
                  AND contype = 'c'
                  AND pg_get_constraintdef(oid) ILIKE '%status%'
                """, String.class);

            for (String constraint : constraints) {
                String safeConstraint = constraint.replace("\"", "\"\"");
                jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT \"" + safeConstraint + "\"");
            }

            logger.info("Order status schema checked; CANCELLED is enabled.");
        } catch (RuntimeException exception) {
            logger.error("Could not update the orders status constraint. CANCELLED may remain unavailable.", exception);
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public void expandOrderLinkColumns() {
        try {
            jdbcTemplate.execute("""
                ALTER TABLE IF EXISTS orders
                ALTER COLUMN order_link TYPE TEXT
                """);
            jdbcTemplate.execute("""
                ALTER TABLE IF EXISTS order_items
                ALTER COLUMN model_url TYPE TEXT
                """);
            logger.info("Order link columns checked; long URLs are enabled.");
        } catch (RuntimeException exception) {
            logger.error("Could not expand order link columns. Long URLs may remain unavailable.", exception);
        }
    }
}
