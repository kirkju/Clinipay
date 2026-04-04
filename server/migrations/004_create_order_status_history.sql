-- Migration: Create order_status_history table
-- CLINIPAY MVP

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='order_status_history' AND xtype='U')
BEGIN
    CREATE TABLE order_status_history (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        order_id        INT NOT NULL REFERENCES orders(id),
        previous_status NVARCHAR(30) NULL,
        new_status      NVARCHAR(30) NOT NULL,
        changed_by      INT NOT NULL REFERENCES users(id),
        notes           NVARCHAR(500) NULL,
        created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_order_status_history_order_id ON order_status_history(order_id);
END
