// Simple Single Reseller Selection Script for Shopify
// This script adds a simple dropdown to select ONE reseller per product

(function () {
  "use strict";

  console.log("🏪 Shopify Single Reseller Script Loading...");

  // Configuration
  const RESELLER_SECTION_ID = "single-reseller-selection";

  // Available resellers (replace with your actual resellers)
  const AVAILABLE_RESELLERS = [
    "Reseller A",
    "Reseller B",
    "Reseller C",
    "Reseller D",
    "Reseller E",
  ];

  // Check if we're on a product editing page
  function isProductEditPage() {
    const path = window.location.pathname;
    return (
      path.includes("/admin/products/") &&
      (path.includes("/edit") || path.match(/\/admin\/products\/\d+$/))
    );
  }

  // Create the simple reseller selection UI
  function createResellerUI() {
    const section = document.createElement("div");
    section.id = RESELLER_SECTION_ID;
    section.style.cssText = `
      background: white;
      border: 2px solid #28a745;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    section.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #28a745;
      ">
        <h3 style="
          margin: 0;
          color: #2c3e50;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          🏪 Select Reseller for This Product
        </h3>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="
          margin: 0 0 15px 0;
          color: #6c757d;
          font-size: 14px;
          line-height: 1.4;
        ">
          Choose which reseller carries this product. Only one reseller can be selected per product.
        </p>
        
        <div style="
          background: #d4edda;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 13px;
          color: #155724;
          border-left: 4px solid #28a745;
          margin-bottom: 15px;
        ">
          <strong>💡 Simple Solution:</strong> This saves the selected reseller name directly to your "Select Resellers" metafield.
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
          font-size: 14px;
        ">Select Reseller:</label>
        
        <select id="reseller-select" style="
          width: 100%;
          padding: 12px;
          border: 1px solid #e1e3e5;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        ">
          <option value="">-- Select a reseller --</option>
          ${AVAILABLE_RESELLERS.map(
            (reseller) => `
            <option value="${reseller}">${reseller}</option>
          `
          ).join("")}
        </select>
      </div>
      
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 20px;
        border-top: 1px solid #e1e3e5;
      ">
        <div id="selected-reseller-display" style="
          font-size: 13px;
          color: #6c757d;
          flex: 1;
        ">No reseller selected</div>
        
        <div style="display: flex; gap: 10px;">
          <button id="clear-reseller-btn" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
          ">Clear</button>
          
          <button id="save-reseller-btn" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
          ">Save Reseller</button>
        </div>
      </div>
      
      <div id="reseller-messages" style="margin-top: 15px;"></div>
    `;

    return section;
  }

  // Update selected reseller display
  function updateSelectedDisplay() {
    const select = document.getElementById("reseller-select");
    const display = document.getElementById("selected-reseller-display");

    if (select.value) {
      display.innerHTML = `<strong>Selected:</strong> ${select.value}`;
      display.style.color = "#155724";
    } else {
      display.textContent = "No reseller selected";
      display.style.color = "#6c757d";
    }
  }

  // Show message
  function showMessage(message, type = "success") {
    const messagesDiv = document.getElementById("reseller-messages");
    if (!messagesDiv) return;

    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = `
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 10px;
      font-size: 14px;
      font-weight: 500;
      background: ${type === "error" ? "#f8d7da" : "#d4edda"};
      color: ${type === "error" ? "#721c24" : "#155724"};
      border: 1px solid ${type === "error" ? "#f5c6cb" : "#c3e6cb"};
      border-left: 4px solid ${type === "error" ? "#dc3545" : "#28a745"};
    `;
    messageDiv.textContent = message;
    messagesDiv.appendChild(messageDiv);

    setTimeout(() => messageDiv.remove(), 5000);
  }

  // Save to metafield
  async function saveReseller() {
    const select = document.getElementById("reseller-select");
    const selectedReseller = select.value;

    if (!selectedReseller) {
      showMessage("Please select a reseller", "error");
      return;
    }

    const saveBtn = document.getElementById("save-reseller-btn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    saveBtn.style.background = "#6c757d";

    try {
      // Get product ID from URL
      const productId = window.location.pathname.match(
        /\/admin\/products\/(\d+)/
      )?.[1];

      if (!productId) {
        throw new Error("Could not determine product ID");
      }

      console.log("📝 Saving reseller to metafield:", selectedReseller);
      console.log("📝 Product ID:", productId);

      // Save to metafield using Shopify's native API
      const metafieldData = {
        metafield: {
          namespace: "custom",
          key: "select_resellers",
          value: selectedReseller, // Single reseller name
          type: "multi_line_text_field",
        },
      };

      // Try to save using Shopify's internal API
      const response = await fetch(`/admin/products/${productId}.json`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": "admin",
        },
        body: JSON.stringify({
          product: {
            id: parseInt(productId),
            metafields: [metafieldData],
          },
        }),
      });

      if (response.ok) {
        // Also save to localStorage as backup
        localStorage.setItem(`single_reseller_${productId}`, selectedReseller);

        showMessage(`✅ Saved "${selectedReseller}" to metafield!`, "success");
        console.log("✅ Successfully saved to Shopify metafield!");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ Error saving to metafield:", error);

      // Fallback to localStorage if API fails
      const productId = window.location.pathname.match(
        /\/admin\/products\/(\d+)/
      )?.[1];

      if (productId) {
        localStorage.setItem(`single_reseller_${productId}`, selectedReseller);
      }

      showMessage(
        `⚠️ Saved to local storage (API unavailable): "${selectedReseller}"`,
        "success"
      );
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Reseller";
      saveBtn.style.background = "#28a745";
    }
  }

  // Initialize
  function init() {
    if (!isProductEditPage()) {
      console.log("❌ Not on a product editing page");
      return;
    }

    console.log("✅ On product editing page, creating single reseller UI...");

    // Wait for page to load
    const checkInterval = setInterval(() => {
      // Try to find a good insertion point
      const possiblePoints = [
        ".Polaris-Page__Content",
        ".admin-content",
        "main",
        ".content",
        "body",
      ];

      let insertionPoint = document.body;
      for (const selector of possiblePoints) {
        const element = document.querySelector(selector);
        if (element) {
          insertionPoint = element;
          break;
        }
      }

      // Check if section already exists
      if (document.getElementById(RESELLER_SECTION_ID)) {
        clearInterval(checkInterval);
        return;
      }

      // Create and insert the section
      const resellerSection = createResellerUI();
      insertionPoint.appendChild(resellerSection);

      // Load saved data
      const productId = window.location.pathname.match(
        /\/admin\/products\/(\d+)/
      )?.[1];
      if (productId) {
        // Try to load from localStorage
        const saved = localStorage.getItem(`single_reseller_${productId}`);
        if (saved) {
          const select = document.getElementById("reseller-select");
          select.value = saved;
          updateSelectedDisplay();
        }
      }

      // Add event listeners
      document.getElementById("reseller-select").onchange =
        updateSelectedDisplay;

      document.getElementById("clear-reseller-btn").onclick = () => {
        const select = document.getElementById("reseller-select");
        select.value = "";
        updateSelectedDisplay();
      };

      document.getElementById("save-reseller-btn").onclick = saveReseller;

      clearInterval(checkInterval);
      console.log("✅ Single reseller section created successfully!");
    }, 500);

    // Stop checking after 30 seconds
    setTimeout(() => clearInterval(checkInterval), 30000);
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  console.log("🏪 Shopify Single Reseller Script Loaded");
})();
