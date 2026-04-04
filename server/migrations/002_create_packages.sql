-- Migration: Create packages table
-- CLINIPAY MVP

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='packages' AND xtype='U')
BEGIN
    CREATE TABLE packages (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        name_es         NVARCHAR(200) NOT NULL,
        name_en         NVARCHAR(200) NOT NULL,
        description_es  NVARCHAR(MAX) NOT NULL,
        description_en  NVARCHAR(MAX) NOT NULL,
        price           DECIMAL(10,2) NOT NULL,
        currency        NVARCHAR(3) NOT NULL DEFAULT 'USD',
        includes_es     NVARCHAR(MAX) NULL,
        includes_en     NVARCHAR(MAX) NULL,
        is_active       BIT NOT NULL DEFAULT 1,
        display_order   INT NOT NULL DEFAULT 0,
        created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_packages_is_active ON packages(is_active);
    CREATE INDEX IX_packages_display_order ON packages(display_order);
END
