const express = require("express");
const { shopifyApp } = require("@shopify/shopify-app-express");
const { ApiVersion } = require("@shopify/shopify-api");
const Database = require("better-sqlite3");
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
const db = new Database("./database.sqlite");

// Create resellers table
db.exec(`CREATE TABLE IF NOT EXISTS resellers (
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

db.exec(`CREATE TABLE IF NOT EXISTS product_resellers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  reseller_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reseller_id) REFERENCES resellers (id)
)`);

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
  try {
    const rows = db.prepare("SELECT * FROM resellers ORDER BY name").all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get reseller by ID
app.get("/api/resellers/:id", (req, res) => {
  const id = req.params.id;
  try {
    const row = db.prepare("SELECT * FROM resellers WHERE id = ?").get(id);
    if (!row) {
      res.status(404).json({ error: "Reseller not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

  try {
    const stmt = db.prepare(
      "INSERT INTO resellers (name, logo_url, description, website_url, location_url, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const result = stmt.run(
      name,
      logo_url,
      description,
      website_url,
      location_url,
      latitude,
      longitude
    );
    res.json({
      id: result.lastInsertRowid,
      message: "Reseller created successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

  try {
    const stmt = db.prepare(
      "UPDATE resellers SET name = ?, logo_url = ?, description = ?, website_url = ?, location_url = ?, latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    );
    const result = stmt.run(
      name,
      logo_url,
      description,
      website_url,
      location_url,
      latitude,
      longitude,
      id
    );
    if (result.changes === 0) {
      res.status(404).json({ error: "Reseller not found" });
      return;
    }
    res.json({ message: "Reseller updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete reseller
app.delete("/api/resellers/:id", (req, res) => {
  const id = req.params.id;

  try {
    const stmt = db.prepare("DELETE FROM resellers WHERE id = ?");
    const result = stmt.run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: "Reseller not found" });
      return;
    }
    res.json({ message: "Reseller deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search resellers
app.get("/api/resellers/search/:query", (req, res) => {
  const query = `%${req.params.query}%`;
  try {
    const stmt = db.prepare(
      "SELECT * FROM resellers WHERE name LIKE ? OR description LIKE ? ORDER BY name"
    );
    const rows = stmt.all(query, query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk import resellers from CSV
app.post("/api/resellers/import", upload.single("csv"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No CSV file uploaded" });
  }

  const results = [];
  const errors = [];

  fs.createReadStream(req.file.path)
    .pipe(
      csv({
        mapHeaders: ({ header }) => {
          const cleaned = (header || "")
            .toString()
            .replace(/^\uFEFF/, "") // strip BOM
            .trim()
            .toLowerCase();
          console.log("Header mapping:", `"${header}" -> "${cleaned}"`);
          return cleaned;
        },
        mapValues: ({ value }) => {
          const cleaned = typeof value === "string" ? value.trim() : value;
          return cleaned;
        },
      })
    )
    .on("data", (row) => {
      try {
        // Debug logging to see what's being parsed
        console.log("Raw CSV row:", JSON.stringify(row, null, 2));
        console.log("Row keys:", Object.keys(row));
        console.log(
          "Row.name value:",
          `"${row.name}"`,
          "Type:",
          typeof row.name
        );

        const name = (row.name || "")
          .toString()
          .replace(/^\uFEFF/, "")
          .trim();
        const logo_url = row.logo_url || "";
        const description = row.description || "";
        const website_url = row.website_url || "";
        const location_url = row.location_url || "";
        const latitude = row.latitude || row.lat || null;
        const longitude = row.longitude || row.lng || null;

        console.log("Processed name:", `"${name}"`, "Length:", name.length);

        if (!name) {
          console.log("ERROR: Name is empty or undefined");
          errors.push({ row, error: "Name is required" });
          return;
        }

        try {
          const stmt = db.prepare(
            "INSERT INTO resellers (name, logo_url, description, website_url, location_url, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)"
          );
          const result = stmt.run(
            name,
            logo_url,
            description,
            website_url,
            location_url,
            latitude,
            longitude
          );
          results.push({ id: result.lastInsertRowid, name });
        } catch (err) {
          errors.push({ row, error: err.message });
        }
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
  try {
    const stmt = db.prepare(`SELECT r.* FROM resellers r 
     JOIN product_resellers pr ON r.id = pr.reseller_id 
     WHERE pr.product_id = ?`);
    const rows = stmt.all(productId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products/:productId/resellers", (req, res) => {
  const productId = req.params.productId;
  const { resellerIds } = req.body;

  if (!Array.isArray(resellerIds)) {
    return res.status(400).json({ error: "resellerIds must be an array" });
  }

  // First, remove existing associations
  try {
    // First delete existing associations
    const deleteStmt = db.prepare(
      "DELETE FROM product_resellers WHERE product_id = ?"
    );
    deleteStmt.run(productId);

    // Then add new associations
    const insertStmt = db.prepare(
      "INSERT INTO product_resellers (product_id, reseller_id) VALUES (?, ?)"
    );
    resellerIds.forEach((resellerId) => {
      insertStmt.run(productId, resellerId);
    });

    res.json({
      message: "Product-reseller associations updated successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create metafield definition
app.post("/api/metafields/definition", async (req, res) => {
  try {
    const { namespace, key, name, description, type } = req.body;

    const session = await shopify.config.sessionStorage.findSessionsByShop(
      shopify.config.hostScheme + "://" + req.get("host")
    );

    if (!session || session.length === 0) {
      return res.status(401).json({ error: "No session found" });
    }

    const client = new shopify.clients.Graphql({
      session: session[0],
    });

    const response = await client.query({
      data: {
        query: `
          mutation metafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
            metafieldDefinitionCreate(definition: $definition) {
              createdDefinition {
                id
                name
                namespace
                key
                description
                type {
                  name
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          definition: {
            namespace: namespace,
            key: key,
            name: name || "Selected Resellers",
            description: description || "Resellers assigned to this product",
            type: type || "json",
            ownerType: "PRODUCT",
          },
        },
      },
    });

    if (response.body.data.metafieldDefinitionCreate.userErrors.length > 0) {
      return res.status(400).json({
        error: "Metafield definition creation failed",
        details: response.body.data.metafieldDefinitionCreate.userErrors,
      });
    }

    res.json({
      success: true,
      definition:
        response.body.data.metafieldDefinitionCreate.createdDefinition,
    });
  } catch (error) {
    console.error("Error creating metafield definition:", error);
    res.status(500).json({ error: "Failed to create metafield definition" });
  }
});

// Get product metafields
app.get("/api/products/:id/metafields", async (req, res) => {
  try {
    const productId = req.params.id;

    const session = await shopify.config.sessionStorage.findSessionsByShop(
      shopify.config.hostScheme + "://" + req.get("host")
    );

    if (!session || session.length === 0) {
      return res.status(401).json({ error: "No session found" });
    }

    const client = new shopify.clients.Graphql({
      session: session[0],
    });

    const response = await client.query({
      data: {
        query: `
          query getProduct($id: ID!) {
            product(id: $id) {
              id
              metafields(first: 100) {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
                    type
                    description
                  }
                }
              }
            }
          }
        `,
        variables: {
          id: `gid://shopify/Product/${productId}`,
        },
      },
    });

    const metafields = response.body.data.product.metafields.edges.map(
      (edge) => edge.node
    );
    res.json(metafields);
  } catch (error) {
    console.error("Error fetching product metafields:", error);
    res.status(500).json({ error: "Failed to fetch product metafields" });
  }
});

// Update product metafield
app.post("/api/products/:id/metafields", async (req, res) => {
  try {
    const productId = req.params.id;
    const { namespace, key, value, type } = req.body;

    const session = await shopify.config.sessionStorage.findSessionsByShop(
      shopify.config.hostScheme + "://" + req.get("host")
    );

    if (!session || session.length === 0) {
      return res.status(401).json({ error: "No session found" });
    }

    const client = new shopify.clients.Graphql({
      session: session[0],
    });

    const response = await client.query({
      data: {
        query: `
          mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields {
                id
                namespace
                key
                value
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          metafields: [
            {
              ownerId: `gid://shopify/Product/${productId}`,
              namespace: namespace,
              key: key,
              value: typeof value === "object" ? JSON.stringify(value) : value,
              type: type || "json",
            },
          ],
        },
      },
    });

    if (response.body.data.metafieldsSet.userErrors.length > 0) {
      return res.status(400).json({
        error: "Metafield update failed",
        details: response.body.data.metafieldsSet.userErrors,
      });
    }

    res.json({
      success: true,
      metafield: response.body.data.metafieldsSet.metafields[0],
    });
  } catch (error) {
    console.error("Error updating product metafield:", error);
    res.status(500).json({ error: "Failed to update product metafield" });
  }
});

// Admin interface routes (placed BEFORE catch-all)
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Product integration demo route
app.get("/product-demo", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "product-demo.html"));
});

// Product reseller management route
app.get("/product-resellers", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "product-resellers.html"));
});

// Admin extension for product reseller selection
app.get("/admin-extension", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-extension.html"));
});

// Product reseller admin interface
app.get("/product-reseller-admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "product-reseller-admin.html"));
});

// Shopify admin integration guide
app.get("/shopify-admin-integration", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "shopify-admin-integration.html")
  );
});

// Theme integration guide
app.get("/theme-integration-guide", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "theme-integration-guide.html"));
});

// Fix instructions
app.get("/fix-instructions", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "fix-instructions.html"));
});

// Debug guide
app.get("/debug-guide", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "debug-guide.html"));
});

// Metafield reseller admin
app.get("/metafield-reseller-admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "metafield-reseller-admin.html"));
});

// Serve the main app (catch-all)
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
