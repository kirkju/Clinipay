# Deployment Diagram

## Overview

```mermaid
graph LR
    subgraph Internet["Internet"]
        User["User Browser"]
    end

    subgraph Frontend["Frontend Hosting"]
        CDN["CDN / Nginx<br/>(Static Files)"]
        SPA["React SPA<br/>dist/"]
    end

    subgraph Backend["Backend Server"]
        PM2["PM2<br/>Process Manager"]
        Express["Express.js API<br/>Port 5000"]
    end

    subgraph Database["Database Server"]
        SQLDB[("SQL Server<br/>Port 1433")]
        Backup["Automated<br/>Backups"]
    end

    subgraph Services["External Services"]
        SMTP["SMTP Server<br/>(SendGrid / SES)"]
        Google["Google OAuth 2.0"]
        BAC["BAC Payment<br/>Gateway"]
    end

    User -->|"HTTPS :443"| CDN
    CDN --> SPA
    User -->|"HTTPS :443<br/>/api/*"| Express
    PM2 -.-> Express
    Express -->|"TDS Protocol<br/>:1433"| SQLDB
    SQLDB -.-> Backup
    Express -->|"SMTP/TLS<br/>:587"| SMTP
    Express -->|"OAuth 2.0<br/>HTTPS"| Google
    Express -->|"REST API<br/>HTTPS"| BAC

    style User fill:#A8E6CF,stroke:#1B5E3B
    style CDN fill:#61DAFB,stroke:#333
    style SPA fill:#61DAFB,stroke:#333
    style PM2 fill:#3EB489,stroke:#1B5E3B,color:#fff
    style Express fill:#3EB489,stroke:#1B5E3B,color:#fff
    style SQLDB fill:#CC2927,stroke:#333,color:#fff
    style Backup fill:#999,stroke:#333
    style SMTP fill:#F5A623,stroke:#333,color:#000
    style Google fill:#4285F4,stroke:#333,color:#fff
    style BAC fill:#1B5E3B,stroke:#333,color:#fff
```

## Production Setup with Nginx

```mermaid
graph TD
    subgraph Internet["Internet"]
        Browser["User Browser"]
    end

    subgraph Server["VPS / Cloud Instance"]
        subgraph Nginx["Nginx Reverse Proxy"]
            SSL["SSL Termination<br/>(Let's Encrypt)"]
            StaticServe["Serve Static Files<br/>/opt/clinipay/client/dist/"]
            ProxyPass["Proxy Pass<br/>/api/* -> :5000"]
        end

        subgraph App["Node.js Application"]
            PM2App["PM2 Process Manager"]
            ExpressApp["Express.js<br/>:5000"]
        end

        subgraph Data["Data Layer"]
            SQLServer[("SQL Server<br/>:1433")]
        end
    end

    subgraph External["External"]
        SMTPExt["SMTP"]
        GoogleExt["Google OAuth"]
        BACExt["BAC Gateway"]
        BackupStorage["Backup Storage<br/>(S3 / Azure Blob)"]
    end

    Browser -->|"HTTPS :443"| SSL
    SSL -->|"Static request"| StaticServe
    SSL -->|"/api/* request"| ProxyPass
    ProxyPass -->|"HTTP :5000"| ExpressApp
    PM2App -.->|"Manages"| ExpressApp
    ExpressApp --> SQLServer
    SQLServer -.->|"Daily backup"| BackupStorage
    ExpressApp --> SMTPExt
    ExpressApp --> GoogleExt
    ExpressApp --> BACExt

    style Browser fill:#A8E6CF,stroke:#1B5E3B
    style Nginx fill:#009639,stroke:#006633,color:#fff
    style SSL fill:#F39C12,stroke:#e67e22,color:#000
    style ExpressApp fill:#3EB489,stroke:#1B5E3B,color:#fff
    style SQLServer fill:#CC2927,stroke:#333,color:#fff
    style PM2App fill:#2B037A,stroke:#333,color:#fff
```

## Azure Deployment

```mermaid
graph TD
    subgraph Internet["Internet"]
        AzUser["User Browser"]
    end

    subgraph AzureFrontend["Azure Static Web Apps"]
        AzSPA["React SPA<br/>(Global CDN)"]
    end

    subgraph AzureBackend["Azure App Service"]
        AzExpress["Express.js API<br/>(Linux, Node 20)"]
    end

    subgraph AzureData["Azure SQL"]
        AzSQL[("Azure SQL Database<br/>(Managed)")]
        AzBackup["Automated Backups<br/>(7-35 day retention)"]
    end

    subgraph AzureServices["Azure Services"]
        KeyVault["Azure Key Vault<br/>(Secrets)"]
        AppInsights["Application Insights<br/>(Monitoring)"]
    end

    subgraph External2["External"]
        SMTP2["SMTP / SendGrid"]
        Google2["Google OAuth"]
        BAC2["BAC Gateway"]
    end

    AzUser -->|"HTTPS"| AzSPA
    AzSPA -->|"/api/* proxy"| AzExpress
    AzExpress --> AzSQL
    AzSQL -.-> AzBackup
    AzExpress -.-> KeyVault
    AzExpress -.-> AppInsights
    AzExpress --> SMTP2
    AzExpress --> Google2
    AzExpress --> BAC2

    style AzUser fill:#A8E6CF,stroke:#1B5E3B
    style AzSPA fill:#0078D4,stroke:#005A9E,color:#fff
    style AzExpress fill:#0078D4,stroke:#005A9E,color:#fff
    style AzSQL fill:#CC2927,stroke:#333,color:#fff
    style KeyVault fill:#F5A623,stroke:#333,color:#000
    style AppInsights fill:#68217A,stroke:#333,color:#fff
```

## Network & Port Summary

| Component | Port | Protocol | Direction |
| --------- | ---- | -------- | --------- |
| Nginx | 443 | HTTPS (TLS 1.2+) | Inbound from Internet |
| Nginx | 80 | HTTP (redirect to 443) | Inbound from Internet |
| Express.js | 5000 | HTTP | Inbound from Nginx only (localhost) |
| SQL Server | 1433 | TDS (encrypted) | Inbound from Express only |
| SMTP | 587 | STARTTLS | Outbound to mail provider |
| Google OAuth | 443 | HTTPS | Outbound to googleapis.com |
| BAC Gateway | 443 | HTTPS | Outbound to BAC + Inbound callback |

## Firewall Rules

| Rule | Source | Destination | Port | Action |
| ---- | ------ | ----------- | ---- | ------ |
| Allow HTTPS | 0.0.0.0/0 | Server | 443 | ALLOW |
| Allow HTTP (redirect) | 0.0.0.0/0 | Server | 80 | ALLOW |
| Allow SSH | Admin IP | Server | 22 | ALLOW |
| Block Express direct | 0.0.0.0/0 | Server | 5000 | DENY |
| Block SQL direct | 0.0.0.0/0 | Server | 1433 | DENY |
