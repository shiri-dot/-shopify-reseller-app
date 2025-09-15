const express = require("express");
const { shopifyApp } = require("@shopify/shopify-app-express");
const { ApiVersion } = require("@shopify/shopify-api");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Initialize database
const db = new sqlite3.Database("./database.sqlite");

// Create resellers table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS resellers (
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
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS product_resellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    reseller_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reseller_id) REFERENCES resellers (id)
  )`);
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Shopify App Configuration
const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SHOPIFY_SCOPES?.split(",") || [
      "read_products",
      "write_products",
    ],
    hostName:
      process.env.SHOPIFY_APP_URL?.replace(/https?:\/\//, "") ||
      "localhost:3000",
    apiVersion: ApiVersion.October23,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
});

// Apply Shopify middleware
app.use(shopify.config.auth.path, shopify.auth.begin());
app.use(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.use(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: {} })
);

// API Routes for Resellers

// Get all resellers
app.get("/api/resellers", (req, res) => {
  db.all("SELECT * FROM resellers ORDER BY name", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get reseller by ID
app.get("/api/resellers/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM resellers WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: "Reseller not found" });
      return;
    }
    res.json(row);
  });
});

// Create new reseller
app.post("/api/resellers", (req, res) => {
  const {
    name,
    logo_url,
    description,
    website_url,
    location_url,
    latitude,
    longitude,
  } = req.body;

  db.run(
    "INSERT INTO resellers (name, logo_url, description, website_url, location_url, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      name,
      logo_url,
      description,
      website_url,
      location_url,
      latitude,
      longitude,
    ],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: "Reseller created successfully" });
    }
  );
});

// Update reseller
app.put("/api/resellers/:id", (req, res) => {
  const id = req.params.id;
  const {
    name,
    logo_url,
    description,
    website_url,
    location_url,
    latitude,
    longitude,
  } = req.body;

  db.run(
    "UPDATE resellers SET name = ?, logo_url = ?, description = ?, website_url = ?, location_url = ?, latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [
      name,
      logo_url,
      description,
      website_url,
      location_url,
      latitude,
      longitude,
      id,
    ],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: "Reseller not found" });
        return;
      }
      res.json({ message: "Reseller updated successfully" });
    }
  );
});

// Delete reseller
app.delete("/api/resellers/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM resellers WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: "Reseller not found" });
      return;
    }
    res.json({ message: "Reseller deleted successfully" });
  });
});

// Search resellers
app.get("/api/resellers/search/:query", (req, res) => {
  const query = `%${req.params.query}%`;
  db.all(
    "SELECT * FROM resellers WHERE name LIKE ? OR description LIKE ? ORDER BY name",
    [query, query],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Bulk import resellers from CSV
app.post("/api/resellers/import", upload.single("csv"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No CSV file uploaded" });
  }

  const results = [];
  const errors = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {
      try {
        const {
          name,
          logo_url,
          description,
          website_url,
          location_url,
          latitude,
          longitude,
        } = row;

        if (!name) {
          errors.push({ row, error: "Name is required" });
          return;
        }

        db.run(
          "INSERT INTO resellers (name, logo_url, description, website_url, location_url, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            name,
            logo_url,
            description,
            website_url,
            location_url,
            latitude,
            longitude,
          ],
          function (err) {
            if (err) {
              errors.push({ row, error: err.message });
            } else {
              results.push({ id: this.lastID, name });
            }
          }
        );
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    })
    .on("end", () => {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        message: "Import completed",
        imported: results.length,
        errors: errors.length,
        results,
        errors,
      });
    });
});

// Product-Reseller associations
app.get("/api/products/:productId/resellers", (req, res) => {
  const productId = req.params.productId;
  db.all(
    `SELECT r.* FROM resellers r 
     JOIN product_resellers pr ON r.id = pr.reseller_id 
     WHERE pr.product_id = ?`,
    [productId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.post("/api/products/:productId/resellers", (req, res) => {
  const productId = req.params.productId;
  const { resellerIds } = req.body;

  if (!Array.isArray(resellerIds)) {
    return res.status(400).json({ error: "resellerIds must be an array" });
  }

  // First, remove existing associations
  db.run(
    "DELETE FROM product_resellers WHERE product_id = ?",
    [productId],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Then add new associations
      const stmt = db.prepare(
        "INSERT INTO product_resellers (product_id, reseller_id) VALUES (?, ?)"
      );
      resellerIds.forEach((resellerId) => {
        stmt.run([productId, resellerId]);
      });
      stmt.finalize();

      res.json({
        message: "Product-reseller associations updated successfully",
      });
    }
  );
});

// Serve the main app
app.get("*", shopify.ensureInstalledOnShop(), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Shopify app URL: ${process.env.SHOPIFY_APP_URL || "http://localhost:3000"}`
  );
});
