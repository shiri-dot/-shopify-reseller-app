# Shopify Reseller App

A B2B2C ecommerce platform built for Shopify that allows you to manage resellers and display them on product pages with map integration.

## Features

### Admin Features

- **Reseller Management**: Add, edit, delete, and search resellers
- **Bulk Import**: Import resellers from CSV files
- **Reseller Information**: Store name, logo, description, website, and location data
- **Product Association**: Link resellers to specific products
- **Map Integration**: View reseller locations on Google Maps

### Customer Features

- **Reseller Discovery**: Customers can find resellers for specific products
- **Interactive Map**: Visual representation of reseller locations
- **Reseller Details**: Access to reseller websites and location information

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd shopify-reseller-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   ```

   Edit `.env` with your configuration:

   - `SHOPIFY_API_KEY`: Your Shopify app's API key
   - `SHOPIFY_API_SECRET`: Your Shopify app's API secret
   - `SHOPIFY_APP_URL`: Your app's public URL (use ngrok for development)
   - `GOOGLE_MAPS_API_KEY`: Your Google Maps API key

4. **Set up Google Maps API**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Maps JavaScript API
   - Create an API key and add it to your `.env` file

5. **Run the application**
   ```bash
   npm start
   ```

## Shopify App Setup

1. **Create a Shopify Partner account** at [partners.shopify.com](https://partners.shopify.com)

2. **Create a new app** in your Partner dashboard

3. **Configure app settings**:

   - App URL: `https://your-app-url.ngrok.io`
   - Allowed redirection URL: `https://your-app-url.ngrok.io/api/auth/callback`
   - App scopes: `read_products`, `write_products`, `read_orders`, `write_orders`

4. **Install the app** on your development store

## Usage

### Adding Resellers

1. Navigate to the "Add Reseller" section
2. Fill in the reseller information:
   - **Name** (required): Reseller's business name
   - **Logo URL**: URL to the reseller's logo image
   - **Description**: Short description of the reseller
   - **Website URL**: Link to reseller's website
   - **Location URL**: Link to reseller's location (Google Maps, etc.)
   - **Latitude/Longitude**: Coordinates for map display

### Bulk Import

1. Prepare a CSV file with the following columns:

   - `name` (required)
   - `logo_url`
   - `description`
   - `website_url`
   - `location_url`
   - `latitude`
   - `longitude`

2. Use the "Import CSV" feature to upload your file

### Managing Resellers

- **Search**: Use the search bar to find specific resellers
- **Edit**: Click the "Edit" button on any reseller
- **Delete**: Click the "Delete" button to remove a reseller
- **View on Map**: Click on any reseller to see their location on the map

### Product Integration

To integrate resellers with your Shopify products, you'll need to:

1. Add the reseller selection to your product pages
2. Use the API endpoints to associate resellers with products
3. Display reseller information on product detail pages

## API Endpoints

### Resellers

- `GET /api/resellers` - Get all resellers
- `GET /api/resellers/:id` - Get specific reseller
- `POST /api/resellers` - Create new reseller
- `PUT /api/resellers/:id` - Update reseller
- `DELETE /api/resellers/:id` - Delete reseller
- `GET /api/resellers/search/:query` - Search resellers
- `POST /api/resellers/import` - Import resellers from CSV

### Product-Reseller Associations

- `GET /api/products/:productId/resellers` - Get resellers for a product
- `POST /api/products/:productId/resellers` - Associate resellers with a product

## Database Schema

### Resellers Table

```sql
CREATE TABLE resellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    website_url TEXT,
    location_url TEXT,
    latitude REAL,
    longitude REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Product-Resellers Table

```sql
CREATE TABLE product_resellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    reseller_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reseller_id) REFERENCES resellers (id)
);
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Deployment

1. **Deploy to your hosting platform** (Heroku, AWS, etc.)
2. **Update your Shopify app settings** with the production URL
3. **Set up environment variables** on your hosting platform
4. **Test the app** on a development store

## Troubleshooting

### Common Issues

1. **Google Maps not loading**: Check your API key and ensure the Maps JavaScript API is enabled
2. **CSV import failing**: Ensure your CSV has the correct column headers
3. **App not installing**: Verify your app URL and callback URL are correct

### Support

For issues and questions, please check the Shopify App Development documentation or create an issue in this repository.

## License

MIT License - see LICENSE file for details.
