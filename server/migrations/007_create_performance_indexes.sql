-- Performance indexes for SEO & API optimization
-- Run only if indexes don't already exist

-- Orders by user (my orders page)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_orders_user_id_created')
  CREATE INDEX IX_orders_user_id_created ON orders (user_id, created_at DESC);

-- Orders by status (admin filtering)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_orders_status_created')
  CREATE INDEX IX_orders_status_created ON orders (status, created_at DESC);

-- Orders by order_number (lookup)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_orders_order_number')
  CREATE INDEX IX_orders_order_number ON orders (order_number);

-- Active packages (public catalog)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_packages_active_order')
  CREATE INDEX IX_packages_active_order ON packages (is_active, display_order);

-- Refresh tokens lookup
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_refresh_tokens_user_valid')
  CREATE INDEX IX_refresh_tokens_user_valid ON refresh_tokens (user_id, is_revoked, expires_at);

-- Order status history by order
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_order_status_history_order')
  CREATE INDEX IX_order_status_history_order ON order_status_history (order_id, created_at DESC);
