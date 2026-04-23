-- Migration: Add senior_discount_enabled to packages
-- CLINIPAY MVP

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('packages') AND name = 'senior_discount_enabled'
)
BEGIN
    ALTER TABLE packages
    ADD senior_discount_enabled BIT NOT NULL
        CONSTRAINT DF_packages_senior_discount_enabled DEFAULT 0;
END
