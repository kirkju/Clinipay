-- Migration: Create users table
-- CLINIPAY MVP

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    CREATE TABLE users (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        email           NVARCHAR(255) NOT NULL UNIQUE,
        password_hash   NVARCHAR(255) NULL,
        first_name      NVARCHAR(100) NOT NULL,
        last_name       NVARCHAR(100) NOT NULL,
        phone           NVARCHAR(20) NULL,
        role            NVARCHAR(20) NOT NULL DEFAULT 'client',
        auth_provider   NVARCHAR(20) NOT NULL DEFAULT 'local',
        google_id       NVARCHAR(255) NULL,
        preferred_language NVARCHAR(5) NOT NULL DEFAULT 'es',
        is_active       BIT NOT NULL DEFAULT 1,
        email_verified  BIT NOT NULL DEFAULT 0,
        created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_users_email ON users(email);
    CREATE INDEX IX_users_google_id ON users(google_id);
END
