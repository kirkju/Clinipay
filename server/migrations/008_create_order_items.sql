-- Migration: Create order_items table and refactor orders for multi-item + patient info
-- CLINIPAY

-- 1. Clean existing test data (only on first run — skip if order_items already exists)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='order_items' AND xtype='U')
BEGIN
  IF EXISTS (SELECT 1 FROM order_status_history)
    DELETE FROM order_status_history;

  IF EXISTS (SELECT 1 FROM orders)
    DELETE FROM orders;
END

-- 2. Drop package_id FK and column from orders
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('orders') AND name LIKE '%package%')
BEGIN
  DECLARE @fk NVARCHAR(256);
  SELECT @fk = name FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('orders')
      AND referenced_object_id = OBJECT_ID('packages');
  IF @fk IS NOT NULL
    EXEC('ALTER TABLE orders DROP CONSTRAINT ' + @fk);
END

IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('orders') AND name = 'IX_orders_package_id')
  DROP INDEX IX_orders_package_id ON orders;

IF COL_LENGTH('orders', 'package_id') IS NOT NULL
  ALTER TABLE orders DROP COLUMN package_id;

-- 3. Rename amount -> total_amount
IF COL_LENGTH('orders', 'amount') IS NOT NULL AND COL_LENGTH('orders', 'total_amount') IS NULL
  EXEC sp_rename 'orders.amount', 'total_amount', 'COLUMN';

-- 4. Create order_items table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='order_items' AND xtype='U')
BEGIN
  CREATE TABLE order_items (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    order_id                INT NOT NULL REFERENCES orders(id),
    package_id              INT NOT NULL REFERENCES packages(id),
    package_name_es         NVARCHAR(255) NOT NULL,
    package_name_en         NVARCHAR(255) NULL,
    unit_price              DECIMAL(10,2) NOT NULL,
    currency                NVARCHAR(3) NOT NULL DEFAULT 'USD',
    -- Patient information
    patient_first_name      NVARCHAR(100) NOT NULL,
    patient_last_name       NVARCHAR(100) NOT NULL,
    patient_id_number       NVARCHAR(50) NULL,
    patient_phone           NVARCHAR(30) NOT NULL,
    patient_email           NVARCHAR(255) NULL,
    patient_birth_date      DATE NOT NULL,
    patient_relationship    NVARCHAR(30) NULL DEFAULT 'self',
    patient_notes           NVARCHAR(MAX) NULL,
    created_at              DATETIME2 NOT NULL DEFAULT GETUTCDATE()
  );

  CREATE INDEX IX_order_items_order_id ON order_items(order_id);
  CREATE INDEX IX_order_items_package_id ON order_items(package_id);
END
