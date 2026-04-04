-- Migration: Create refresh_tokens table
-- CLINIPAY MVP

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='refresh_tokens' AND xtype='U')
BEGIN
    CREATE TABLE refresh_tokens (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        user_id         INT NOT NULL REFERENCES users(id),
        token_hash      NVARCHAR(255) NOT NULL,
        expires_at      DATETIME2 NOT NULL,
        is_revoked      BIT NOT NULL DEFAULT 0,
        created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_refresh_tokens_user_id ON refresh_tokens(user_id);
    CREATE INDEX IX_refresh_tokens_token_hash ON refresh_tokens(token_hash);
END
