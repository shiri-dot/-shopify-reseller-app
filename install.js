#!/usr/bin/env node

/**
 * Installation script for Shopify Reseller App
 * This script helps set up the app with proper configuration
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function install() {
  console.log("🚀 Welcome to Shopify Reseller App Installation\n");

  try {
    // Check if .env file exists
    if (fs.existsSync(".env")) {
      const overwrite = await question(
        "⚠️  .env file already exists. Overwrite? (y/N): "
      );
      if (overwrite.toLowerCase() !== "y") {
        console.log("Installation cancelled.");
        rl.close();
        return;
      }
    }

    // Collect configuration
    console.log("📝 Please provide the following configuration:\n");

    const config = {
      SHOPIFY_API_KEY: await question("Shopify API Key: "),
      SHOPIFY_API_SECRET: await question("Shopify API Secret: "),
      SHOPIFY_APP_URL: await question(
        "App URL (e.g., https://your-app.ngrok.io): "
      ),
      GOOGLE_MAPS_API_KEY: await question("Google Maps API Key: "),
      PORT: (await question("Port (default: 3000): ")) || "3000",
      NODE_ENV:
        (await question(
          "Environment (development/production) [development]: "
        )) || "development",
    };

    // Create .env file
    const envContent = Object.entries(config)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    fs.writeFileSync(".env", envContent);
    console.log("✅ .env file created successfully");

    // Create uploads directory
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
      console.log("✅ uploads directory created");
    }

    // Create sample CSV file
    const sampleCSV = `name,logo_url,description,website_url,location_url,latitude,longitude
"Acme Industrial","https://example.com/logo1.png","Leading industrial supplier","https://acme-industrial.com","https://maps.google.com/?q=123+Main+St",40.7128,-74.0060
"Global Equipment Co","https://example.com/logo2.png","Worldwide equipment distributor","https://global-equipment.com","https://maps.google.com/?q=456+Oak+Ave",34.0522,-118.2437
"Tech Solutions Inc","https://example.com/logo3.png","Technology and industrial solutions","https://tech-solutions.com","https://maps.google.com/?q=789+Pine+St",41.8781,-87.6298`;

    fs.writeFileSync("sample-resellers.csv", sampleCSV);
    console.log("✅ Sample CSV file created (sample-resellers.csv)");

    // Update shopify.app.toml
    const tomlContent = `# Learn more about configuring your app at https://shopify.dev/docs/apps/tools/cli/configuration

name = "reseller-app"
client_id = "${config.SHOPIFY_API_KEY}"
application_url = "${config.SHOPIFY_APP_URL}"
embedded = true

[access_scopes]
# Learn more at https://shopify.dev/docs/apps/tools/cli/configuration#access_scopes
scopes = "read_products,write_products,read_orders,write_orders"

[auth]
redirect_urls = [
  "${config.SHOPIFY_APP_URL}/api/auth/callback",
]

[webhooks]
api_version = "2023-10"

[pos]
embedded = false`;

    fs.writeFileSync("shopify.app.toml", tomlContent);
    console.log("✅ shopify.app.toml updated");

    // Create startup script
    const startupScript = `#!/bin/bash
echo "🚀 Starting Shopify Reseller App..."
echo "📱 App URL: ${config.SHOPIFY_APP_URL}"
echo "🔧 Environment: ${config.NODE_ENV}"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the application
echo "🌟 Starting server on port ${config.PORT}..."
npm start`;

    fs.writeFileSync("start.sh", startupScript);
    fs.chmodSync("start.sh", "755");
    console.log("✅ Startup script created (start.sh)");

    console.log("\n🎉 Installation completed successfully!\n");
    console.log("📋 Next steps:");
    console.log("1. Install dependencies: npm install");
    console.log("2. Start the app: npm start (or ./start.sh)");
    console.log("3. Install the app on your Shopify store");
    console.log("4. Test the reseller functionality\n");

    console.log("📚 Documentation:");
    console.log("- README.md - Complete setup guide");
    console.log("- sample-resellers.csv - Example CSV for bulk import");
    console.log(
      "- shopify-theme-integration.liquid - Theme integration code\n"
    );
  } catch (error) {
    console.error("❌ Installation failed:", error.message);
  } finally {
    rl.close();
  }
}

// Run installation
install();
