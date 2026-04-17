-- Migration: Add soft delete (deleted_at) to core tables
-- CLINIPAY

-- Users
IF COL_LENGTH('users', 'deleted_at') IS NULL
  ALTER TABLE users ADD deleted_at DATETIME2 NULL;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('users') AND name = 'IX_users_deleted_at')
  CREATE INDEX IX_users_deleted_at ON users(deleted_at);

-- Packages
IF COL_LENGTH('packages', 'deleted_at') IS NULL
  ALTER TABLE packages ADD deleted_at DATETIME2 NULL;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('packages') AND name = 'IX_packages_deleted_at')
  CREATE INDEX IX_packages_deleted_at ON packages(deleted_at);

-- Orders
IF COL_LENGTH('orders', 'deleted_at') IS NULL
  ALTER TABLE orders ADD deleted_at DATETIME2 NULL;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('orders') AND name = 'IX_orders_deleted_at')
  CREATE INDEX IX_orders_deleted_at ON orders(deleted_at);

-- Order Items
IF COL_LENGTH('order_items', 'deleted_at') IS NULL
  ALTER TABLE order_items ADD deleted_at DATETIME2 NULL;
