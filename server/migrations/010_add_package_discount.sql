-- Migration: Add discount_percentage to packages
-- CLINIPAY MVP

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('packages') AND name = 'discount_percentage'
)
BEGIN
    ALTER TABLE packages
    ADD discount_percentage DECIMAL(5,2) NOT NULL
        CONSTRAINT DF_packages_discount_percentage DEFAULT 0
        CONSTRAINT CK_packages_discount_percentage CHECK (discount_percentage >= 0 AND discount_percentage <= 100);
END
