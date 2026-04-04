-- Migration: Create orders table
-- CLINIPAY MVP

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='orders' AND xtype='U')
BEGIN
    CREATE TABLE orders (
        id                  INT IDENTITY(1,1) PRIMARY KEY,
        order_number        NVARCHAR(50) NOT NULL UNIQUE,
        user_id             INT NOT NULL REFERENCES users(id),
        package_id          INT NOT NULL REFERENCES packages(id),
        amount              DECIMAL(10,2) NOT NULL,
        currency            NVARCHAR(3) NOT NULL DEFAULT 'USD',
        status              NVARCHAR(30) NOT NULL DEFAULT 'pending',
        payment_reference   NVARCHAR(255) NULL,
        payment_method      NVARCHAR(50) NULL,
        payment_date        DATETIME2 NULL,
        notes               NVARCHAR(MAX) NULL,
        created_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_orders_user_id ON orders(user_id);
    CREATE INDEX IX_orders_package_id ON orders(package_id);
    CREATE INDEX IX_orders_status ON orders(status);
    CREATE INDEX IX_orders_order_number ON orders(order_number);
    CREATE INDEX IX_orders_created_at ON orders(created_at);
END
