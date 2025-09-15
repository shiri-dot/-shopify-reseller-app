#!/usr/bin/env node

/**
 * Test Setup Script for Shopify Reseller App
 * This script tests the basic functionality of the app
 */

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

async function testSetup() {
  console.log("🧪 Testing Shopify Reseller App Setup\n");

  let testsPassed = 0;
  let totalTests = 0;

  function test(name, testFn) {
    totalTests++;
    try {
      const result = testFn();
      if (result) {
        console.log(`✅ ${name}`);
        testsPassed++;
      } else {
        console.log(`❌ ${name}`);
      }
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error.message}`);
    }
  }

  // Test 1: Check if required files exist
  test("Required files exist", () => {
    const requiredFiles = [
      "package.json",
      "server.js",
      "public/index.html",
      "public/styles.css",
      "public/app.js",
      "public/admin.html",
      "public/admin-styles.css",
      "public/admin-app.js",
      "public/reseller-app.js",
      "public/reseller-app.css",
      "README.md",
    ];

    return requiredFiles.every((file) => fs.existsSync(file));
  });

  // Test 2: Check if package.json has required dependencies
  test("Package.json has required dependencies", () => {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const requiredDeps = [
      "@shopify/shopify-api",
      "@shopify/shopify-app-express",
      "express",
      "sqlite3",
      "dotenv",
      "cors",
      "multer",
      "csv-parser",
      "axios",
    ];

    return requiredDeps.every(
      (dep) => packageJson.dependencies && packageJson.dependencies[dep]
    );
  });

  // Test 3: Check if .env file exists
  test(".env file exists", () => {
    return fs.existsSync(".env");
  });

  // Test 4: Check if .env has required variables
  test(".env has required variables", () => {
    if (!fs.existsSync(".env")) return false;

    const envContent = fs.readFileSync(".env", "utf8");
    const requiredVars = [
      "SHOPIFY_API_KEY",
      "SHOPIFY_API_SECRET",
      "SHOPIFY_APP_URL",
      "GOOGLE_MAPS_API_KEY",
    ];

    return requiredVars.every((varName) => envContent.includes(varName));
  });

  // Test 5: Test database creation
  test("Database can be created", () => {
    return new Promise((resolve) => {
      const db = new sqlite3.Database(":memory:");

      db.serialize(() => {
        db.run(
          `CREATE TABLE IF NOT EXISTS resellers (
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
                )`,
          (err) => {
            if (err) {
              resolve(false);
            } else {
              resolve(true);
            }
          }
        );

        db.run(
          `CREATE TABLE IF NOT EXISTS product_resellers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id TEXT NOT NULL,
                    reseller_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (reseller_id) REFERENCES resellers (id)
                )`,
          (err) => {
            if (err) {
              resolve(false);
            } else {
              resolve(true);
            }
          }
        );
      });

      db.close();
    });
  });

  // Test 6: Check if uploads directory exists
  test("Uploads directory exists", () => {
    return fs.existsSync("uploads");
  });

  // Test 7: Check if sample CSV exists
  test("Sample CSV file exists", () => {
    return fs.existsSync("sample-resellers.csv");
  });

  // Test 8: Validate sample CSV format
  test("Sample CSV has correct format", () => {
    if (!fs.existsSync("sample-resellers.csv")) return false;

    const csvContent = fs.readFileSync("sample-resellers.csv", "utf8");
    const lines = csvContent.split("\n");
    const header = lines[0];

    const requiredColumns = [
      "name",
      "logo_url",
      "description",
      "website_url",
      "location_url",
      "latitude",
      "longitude",
    ];

    return requiredColumns.every((col) => header.includes(col));
  });

  // Test 9: Check if HTML files are valid
  test("HTML files are valid", () => {
    const htmlFiles = ["public/index.html", "public/admin.html"];

    return htmlFiles.every((file) => {
      if (!fs.existsSync(file)) return false;
      const content = fs.readFileSync(file, "utf8");
      return content.includes("<!DOCTYPE html>") && content.includes("</html>");
    });
  });

  // Test 10: Check if CSS files exist
  test("CSS files exist", () => {
    const cssFiles = [
      "public/styles.css",
      "public/admin-styles.css",
      "public/reseller-app.css",
    ];

    return cssFiles.every((file) => fs.existsSync(file));
  });

  // Wait for async tests to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`\n📊 Test Results: ${testsPassed}/${totalTests} tests passed\n`);

  if (testsPassed === totalTests) {
    console.log(
      "🎉 All tests passed! Your Shopify Reseller App is ready to go.\n"
    );
    console.log("📋 Next steps:");
    console.log("1. Run: npm install");
    console.log("2. Run: npm start");
    console.log("3. Install the app on your Shopify store");
    console.log("4. Test the functionality with the sample data\n");
  } else {
    console.log(
      "⚠️  Some tests failed. Please check the issues above and fix them before proceeding.\n"
    );
    console.log("💡 Common issues:");
    console.log("- Missing .env file: Run node install.js");
    console.log("- Missing dependencies: Run npm install");
    console.log("- Invalid configuration: Check your .env file\n");
  }
}

// Run tests
testSetup().catch(console.error);
