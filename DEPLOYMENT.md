# Deployment Guide - Shopify Reseller App

This guide will help you deploy your Shopify Reseller App to production.

## Prerequisites

- Node.js 16+ installed
- A hosting platform (Heroku, AWS, DigitalOcean, etc.)
- Domain name or subdomain
- SSL certificate (most hosting platforms provide this)
- Google Maps API key
- Shopify Partner account

## 1. Prepare for Production

### Environment Variables

Create a production `.env` file with the following variables:

```bash
# Shopify App Configuration
SHOPIFY_API_KEY=your_production_api_key
SHOPIFY_API_SECRET=your_production_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders
SHOPIFY_APP_URL=https://your-production-domain.com
SHOPIFY_APP_HANDLE=reseller-app

# Database Configuration
DATABASE_URL=./database.sqlite

# Server Configuration
PORT=3000
NODE_ENV=production

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Update Shopify App Settings

1. Go to your [Shopify Partner Dashboard](https://partners.shopify.com)
2. Select your app
3. Update the following settings:
   - **App URL**: `https://your-production-domain.com`
   - **Allowed redirection URL(s)**: `https://your-production-domain.com/api/auth/callback`
   - **Webhook endpoints**: Update any webhook URLs to use your production domain

## 2. Deployment Options

### Option A: Heroku Deployment

1. **Install Heroku CLI**

   ```bash
   # macOS
   brew install heroku/brew/heroku

   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku App**

   ```bash
   heroku create your-app-name
   ```

3. **Set Environment Variables**

   ```bash
   heroku config:set SHOPIFY_API_KEY=your_api_key
   heroku config:set SHOPIFY_API_SECRET=your_api_secret
   heroku config:set SHOPIFY_APP_URL=https://your-app-name.herokuapp.com
   heroku config:set GOOGLE_MAPS_API_KEY=your_google_maps_key
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**

   ```bash
   git add .
   git commit -m "Deploy to production"
   git push heroku main
   ```

5. **Open App**
   ```bash
   heroku open
   ```

### Option B: AWS EC2 Deployment

1. **Launch EC2 Instance**

   - Choose Ubuntu 20.04 LTS
   - Select t2.micro (free tier) or larger
   - Configure security group to allow HTTP (80) and HTTPS (443)

2. **Connect to Instance**

   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Dependencies**

   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx certbot python3-certbot-nginx
   ```

4. **Clone and Setup App**

   ```bash
   git clone your-repo-url
   cd your-app-directory
   npm install
   ```

5. **Configure Environment**

   ```bash
   cp env.example .env
   nano .env  # Edit with your production values
   ```

6. **Setup PM2 for Process Management**

   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name "reseller-app"
   pm2 startup
   pm2 save
   ```

7. **Configure Nginx**

   ```bash
   sudo nano /etc/nginx/sites-available/reseller-app
   ```

   Add the following configuration:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Enable Site and SSL**
   ```bash
   sudo ln -s /etc/nginx/sites-available/reseller-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option C: DigitalOcean App Platform

1. **Connect GitHub Repository**

   - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub repository

2. **Configure App**

   - **Source**: Select your repository and branch
   - **Type**: Web Service
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
   - **HTTP Port**: 3000

3. **Set Environment Variables**

   - Add all required environment variables in the app settings

4. **Deploy**
   - Click "Create Resources"
   - Wait for deployment to complete

## 3. Database Considerations

### SQLite (Default)

- Good for small to medium applications
- File-based, no separate database server needed
- **Backup**: Regularly backup the `database.sqlite` file

### PostgreSQL (Recommended for Production)

1. **Install PostgreSQL**

   ```bash
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib

   # macOS
   brew install postgresql
   ```

2. **Create Database**

   ```bash
   sudo -u postgres createdb reseller_app
   sudo -u postgres createuser reseller_user
   sudo -u postgres psql -c "ALTER USER reseller_user PASSWORD 'your_password';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE reseller_app TO reseller_user;"
   ```

3. **Update Environment Variables**

   ```bash
   DATABASE_URL=postgresql://reseller_user:your_password@localhost:5432/reseller_app
   ```

4. **Update Server Code**
   - Replace SQLite with PostgreSQL driver
   - Update database queries if needed

## 4. SSL Certificate

### Let's Encrypt (Free)

```bash
sudo certbot --nginx -d your-domain.com
```

### Cloudflare (Recommended)

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS encryption
4. Configure proxy settings

## 5. Monitoring and Logging

### PM2 Monitoring

```bash
pm2 monit
pm2 logs
```

### Log Rotation

```bash
pm2 install pm2-logrotate
```

### Health Check Endpoint

Add to your server.js:

```javascript
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});
```

## 6. Backup Strategy

### Database Backup

```bash
# SQLite
cp database.sqlite database-backup-$(date +%Y%m%d).sqlite

# PostgreSQL
pg_dump reseller_app > backup-$(date +%Y%m%d).sql
```

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
cp database.sqlite backups/database-$DATE.sqlite
find backups/ -name "*.sqlite" -mtime +7 -delete
```

## 7. Performance Optimization

### Enable Gzip Compression

```javascript
const compression = require("compression");
app.use(compression());
```

### Set Cache Headers

```javascript
app.use(
  express.static("public", {
    maxAge: "1d",
  })
);
```

### Database Indexing

```sql
CREATE INDEX idx_resellers_name ON resellers(name);
CREATE INDEX idx_product_resellers_product_id ON product_resellers(product_id);
```

## 8. Security Considerations

### Environment Variables

- Never commit `.env` files to version control
- Use strong, unique passwords
- Rotate API keys regularly

### HTTPS Only

```javascript
app.use((req, res, next) => {
  if (req.header("x-forwarded-proto") !== "https") {
    res.redirect(`https://${req.header("host")}${req.url}`);
  } else {
    next();
  }
});
```

### Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);
```

## 9. Testing Production Deployment

1. **Health Check**

   ```bash
   curl https://your-domain.com/health
   ```

2. **Test API Endpoints**

   ```bash
   curl https://your-domain.com/api/resellers
   ```

3. **Test Shopify Integration**
   - Install app on development store
   - Test reseller management
   - Test product integration

## 10. Troubleshooting

### Common Issues

1. **App not loading in Shopify**

   - Check app URL and callback URL
   - Verify SSL certificate
   - Check server logs

2. **Database errors**

   - Verify database file permissions
   - Check disk space
   - Review database logs

3. **Google Maps not loading**
   - Verify API key
   - Check domain restrictions
   - Review browser console for errors

### Logs and Debugging

```bash
# PM2 logs
pm2 logs reseller-app

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Application logs
tail -f logs/app.log
```

## 11. Maintenance

### Regular Tasks

- Monitor server resources
- Update dependencies
- Backup database
- Review logs for errors
- Update SSL certificates

### Updates

```bash
git pull origin main
npm install
pm2 restart reseller-app
```

## Support

For deployment issues:

1. Check the logs
2. Review this guide
3. Check Shopify App Development documentation
4. Create an issue in the repository

Remember to test thoroughly in a staging environment before deploying to production!
