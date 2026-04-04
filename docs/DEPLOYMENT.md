# Deployment Guide

This guide covers deploying CLINIPAY to a production environment on either a VPS (e.g., DigitalOcean, Linode, Hetzner) or Microsoft Azure.

---

## Server Requirements

| Resource | Minimum | Recommended |
| -------- | ------- | ----------- |
| CPU | 1 vCPU | 2 vCPUs |
| RAM | 1 GB | 2 GB |
| Disk | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 LTS / Windows Server 2022 | Ubuntu 22.04 LTS |
| Node.js | 18.x | 20.x LTS |
| SQL Server | 2019 Express | 2022 Standard / Azure SQL |

---

## Option A: VPS Deployment

### 1. Provision the Server

Create a VPS with Ubuntu 22.04 LTS. Ensure ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) are open in the firewall.

### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # v20.x
npm --version    # 10.x

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 3. Set Up SQL Server

**Option 1: SQL Server on the same VPS (Linux)**

```bash
# Import Microsoft GPG key
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | sudo gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg

# Add SQL Server repo
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/ubuntu/22.04/mssql-server-2022 jammy main" | sudo tee /etc/apt/sources.list.d/mssql-server.list

sudo apt update
sudo apt install -y mssql-server
sudo /opt/mssql/bin/mssql-conf setup

# Install command-line tools
sudo apt install -y mssql-tools unixodbc-dev
echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
source ~/.bashrc
```

**Option 2: Azure SQL Database** (see [Option B](#option-b-azure-deployment) below).

**Option 3: SQL Server in Docker**

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong!Password" \
  -p 1433:1433 --name clinipay-db -d mcr.microsoft.com/mssql/server:2022-latest
```

### 4. Create the Database

```bash
sqlcmd -S localhost -U sa -P 'YourStrong!Password' -Q "CREATE DATABASE clinipay"
```

### 5. Deploy the Application

```bash
# Clone the repository
cd /opt
sudo git clone <repository-url> clinipay
sudo chown -R $USER:$USER /opt/clinipay

# Install server dependencies
cd /opt/clinipay/server
npm ci --production

# Install client dependencies and build
cd /opt/clinipay/client
npm ci
npm run build
```

### 6. Configure Environment Variables

Create `/opt/clinipay/server/.env`:

```env
NODE_ENV=production
PORT=5000

DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=YourStrong!Password
DB_NAME=clinipay
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

JWT_SECRET=<generate-a-64-char-random-string>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
SMTP_FROM=CLINIPAY <noreply@yourdomain.com>

CLIENT_URL=https://yourdomain.com

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 7. Run Migrations and Seeds

```bash
cd /opt/clinipay/server
npm run migrate
npm run seed
```

### 8. Start the Application with PM2

```bash
cd /opt/clinipay/server
pm2 start src/app.js --name clinipay-api
pm2 save
pm2 startup    # Follow the instructions to enable auto-start on boot
```

### 9. Configure Nginx

Create `/etc/nginx/sites-available/clinipay`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve React SPA static files
    root /opt/clinipay/client/dist;
    index index.html;

    # API proxy to Express
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA fallback: serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers (supplementing Helmet)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/clinipay /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 10. Set Up SSL with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot automatically configures Nginx for HTTPS and sets up auto-renewal.

Verify auto-renewal:

```bash
sudo certbot renew --dry-run
```

---

## Option B: Azure Deployment

### 1. Azure SQL Database

1. Create an Azure SQL Database in the Azure Portal.
2. Set the server firewall to allow your app server's IP.
3. Note the connection details: server name (`xxx.database.windows.net`), database name, admin username, password.
4. Update `.env`:

```env
DB_HOST=xxx.database.windows.net
DB_PORT=1433
DB_USER=clinipay_admin
DB_PASSWORD=<azure-sql-password>
DB_NAME=clinipay
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
```

### 2. Azure App Service

1. Create a Node.js Web App in Azure App Service (Linux, Node 20 LTS).
2. Configure application settings (environment variables) in the Azure Portal.
3. Deploy the backend via:
   - **GitHub Actions** (recommended): Set up CI/CD to build and deploy on push.
   - **Azure CLI**: `az webapp deploy --src-path ./server`.
   - **ZIP deploy**: Upload a ZIP of the server directory.
4. Set the startup command: `node src/app.js`.

### 3. Azure Static Web Apps (Frontend)

1. Build the frontend: `cd client && npm run build`.
2. Create an Azure Static Web App.
3. Deploy the `client/dist/` folder.
4. Configure a fallback route to `index.html` for SPA routing.
5. Set up a proxy rule to forward `/api/*` to the App Service backend.

### 4. Alternative: Single App Service

Serve both frontend and backend from one App Service:
1. Build the frontend.
2. Copy `client/dist/` to `server/public/`.
3. In `app.js`, serve static files from `public/` with Express:

```javascript
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

---

## Frontend Build Options

### Option 1: Nginx (Recommended for VPS)

Nginx serves the static files and proxies API requests. This is the most performant option.

### Option 2: Express Static Middleware

Express serves the built frontend alongside the API. Simpler setup but slightly less efficient.

Add to `app.js` (after all API routes):

```javascript
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}
```

### Option 3: CDN (Azure Static Web Apps, Cloudflare Pages, Vercel)

Deploy the frontend to a CDN for global distribution and edge caching. Configure a reverse proxy or custom domain to route `/api` requests to the backend.

---

## Production Environment Variable Checklist

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `NODE_ENV` | Yes | Must be `production`. |
| `PORT` | Yes | The port Express listens on (e.g., `5000` or `8080`). |
| `DB_HOST` | Yes | SQL Server hostname. |
| `DB_PORT` | Yes | Usually `1433`. |
| `DB_USER` | Yes | Database user. |
| `DB_PASSWORD` | Yes | Database password. |
| `DB_NAME` | Yes | Database name. |
| `DB_ENCRYPT` | Yes | `true` for Azure SQL; `false` for local. |
| `DB_TRUST_SERVER_CERTIFICATE` | Yes | `false` for production with proper certificates. |
| `JWT_SECRET` | Yes | A long, random string (64+ characters). |
| `JWT_EXPIRES_IN` | Yes | Access token lifetime (e.g., `15m`). |
| `REFRESH_TOKEN_EXPIRES_IN` | Yes | Refresh token lifetime (e.g., `7d`). |
| `GOOGLE_CLIENT_ID` | If using Google OAuth | From Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | If using Google OAuth | From Google Cloud Console. |
| `GOOGLE_CALLBACK_URL` | If using Google OAuth | Must use HTTPS in production. |
| `SMTP_HOST` | Yes | SMTP server hostname. |
| `SMTP_PORT` | Yes | Usually `587` (TLS) or `465` (SSL). |
| `SMTP_USER` | Yes | SMTP auth user. |
| `SMTP_PASS` | Yes | SMTP auth password or API key. |
| `SMTP_FROM` | Yes | Sender address. |
| `CLIENT_URL` | Yes | Frontend URL for CORS and email links. |
| `RATE_LIMIT_WINDOW_MS` | Optional | Override default (900000ms = 15min). |
| `RATE_LIMIT_MAX_REQUESTS` | Optional | Override default (100). |

---

## SSL/HTTPS Setup

### VPS with Let's Encrypt (Free)

See Step 10 above. Certbot handles certificate issuance and auto-renewal.

### Azure

- **App Service**: HTTPS is provided by default on `*.azurewebsites.net`. For custom domains, Azure provides free managed certificates.
- **Azure SQL**: TLS is enforced by default. Set `DB_ENCRYPT=true`.

### Key SSL Considerations

- Set `NODE_ENV=production` so the Nodemailer transporter enforces TLS certificate validation.
- Set the `Secure` flag on the refresh token cookie (Express does this automatically when the request arrives via HTTPS and `trust proxy` is enabled).
- Update `GOOGLE_CALLBACK_URL` to use `https://`.
- Update `CLIENT_URL` to use `https://`.
- When behind a reverse proxy (Nginx, Azure), enable trust proxy in Express:

```javascript
app.set('trust proxy', 1);
```

---

## Monitoring & Maintenance

### PM2 Monitoring (VPS)

```bash
pm2 status          # Process status
pm2 logs clinipay-api  # View logs
pm2 monit           # Real-time monitoring
```

### Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Database Backups

```bash
# Automated daily backup (add to crontab)
0 2 * * * /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'Password' \
  -Q "BACKUP DATABASE clinipay TO DISK='/backups/clinipay_$(date +\%Y\%m\%d).bak'"
```

For Azure SQL, enable automated backups in the Azure Portal (enabled by default with 7-day retention).

---

## References

- [Architecture](./ARCHITECTURE.md)
- [Security](./SECURITY.md)
- [Deployment Diagram](./diagrams/deployment-diagram.md)
