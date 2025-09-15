# Direct Shopify Store Integration Guide

## 🏪 Adding Your App Directly to Shopify Store

### Step 1: Create Custom App in Shopify Admin

1. **Login to your Shopify Admin**
2. **Go to Settings → Apps and sales channels**
3. **Click "Develop apps" (at the bottom)**
4. **Click "Create an app"**
5. **Fill in:**
   - App name: "Reseller Management"
   - App developer: Your name
6. **Click "Create app"**

### Step 2: Configure App Settings

1. **In your app, go to "Configuration"**
2. **Set App URL:** `https://your-domain.com`
3. **Set Allowed redirection URL:** `https://your-domain.com/api/auth/callback`
4. **Set Admin API access scopes:**
   - ✅ read_products
   - ✅ write_products
   - ✅ read_orders
   - ✅ write_orders

### Step 3: Get API Credentials

1. **Go to "API credentials" tab**
2. **Copy:**
   - API key
   - API secret key
3. **Click "Install app"**

### Step 4: Update Your .env File

Create a `.env` file with your credentials:

```bash
SHOPIFY_API_KEY=your_api_key_from_step_3
SHOPIFY_API_SECRET=your_api_secret_from_step_3
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders
SHOPIFY_APP_URL=https://your-domain.com
SHOPIFY_APP_HANDLE=reseller-app
DATABASE_URL=./database.sqlite
PORT=3000
NODE_ENV=development
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Step 5: Deploy Your App

#### Option A: Local Development with ngrok

1. **Install ngrok:** https://ngrok.com/download
2. **Start your app:**
   ```bash
   npm start
   ```
3. **In another terminal, expose your app:**
   ```bash
   ngrok http 3000
   ```
4. **Copy the ngrok URL** (e.g., https://abc123.ngrok.io)
5. **Update your .env file** with the ngrok URL
6. **Update Shopify app settings** with the ngrok URL

#### Option B: Deploy to Heroku

1. **Create Heroku app:**
   ```bash
   heroku create your-reseller-app
   ```
2. **Set environment variables:**
   ```bash
   heroku config:set SHOPIFY_API_KEY=your_key
   heroku config:set SHOPIFY_API_SECRET=your_secret
   heroku config:set SHOPIFY_APP_URL=https://your-app.herokuapp.com
   ```
3. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy reseller app"
   git push heroku main
   ```

### Step 6: Test Your App

1. **Go to your Shopify Admin**
2. **Click on your app** in the Apps section
3. **Test the reseller management features:**
   - Add resellers
   - Import CSV
   - View on map
   - Link to products

## 🎯 Benefits of Direct Integration

- ✅ **No Partner account needed**
- ✅ **Immediate access to your store**
- ✅ **Full control over the app**
- ✅ **No App Store review process**
- ✅ **Perfect for custom solutions**

## 🔧 App Features Available

Once installed, your app will provide:

1. **Reseller Management Interface**

   - Add/edit/delete resellers
   - Bulk CSV import
   - Search and filter

2. **Map Integration**

   - Visual reseller locations
   - Interactive Google Maps

3. **Product Integration**

   - Link resellers to products
   - Customer-facing reseller selection

4. **Admin Dashboard**
   - Professional table view
   - Pagination and sorting
   - Logo management

## 📱 Accessing Your App

After installation, you can access your app:

1. **From Shopify Admin:** Apps → Your App Name
2. **Direct URL:** Your deployed app URL
3. **Embedded in Shopify:** The app will appear in your admin interface

## 🚨 Important Notes

- **Custom apps** are only available to the store that created them
- **API credentials** are store-specific
- **No App Store distribution** (only for your store)
- **Full control** over updates and features

## 🔄 Updates and Maintenance

To update your app:

1. **Make changes** to your code
2. **Deploy** to your hosting platform
3. **Changes are live** immediately (no review needed)

This approach gives you complete control and immediate access to your reseller management system!
