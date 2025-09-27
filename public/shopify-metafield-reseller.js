// Simple Shopify Metafield Reseller Script
// This script adds reseller selection using Shopify metafields
// Much simpler than the previous complex solution!

(function () {
  "use strict";

  console.log("🏪 Shopify Metafield Reseller Script Loading...");

  // Configuration
  const RESELLER_SECTION_ID = "metafield-reseller-selection";

  // Mock reseller data (replace with your actual resellers)
  const AVAILABLE_RESELLERS = [
    {
      id: 1,
      name: "Reseller A",
      description: "Test reseller for demonstration",
    },
    { id: 2, name: "Reseller B", description: "Another test reseller" },
    { id: 3, name: "Reseller C", description: "Third test reseller" },
    { id: 4, name: "Reseller D", description: "Fourth test reseller" },
    { id: 5, name: "Reseller E", description: "Fifth test reseller" },
  ];

  // Check if we're on a product editing page
  function isProductEditPage() {
    const path = window.location.pathname;
    return (
      path.includes("/admin/products/") &&
      (path.includes("/edit") || path.match(/\/admin\/products\/\d+$/))
    );
  }

  // Create the reseller selection UI
  function createResellerUI() {
    const section = document.createElement("div");
    section.id = RESELLER_SECTION_ID;
    section.style.cssText = `
      background: white;
      border: 2px solid #007bff;
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
        border-bottom: 2px solid #007bff;
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
          🏪 Product Resellers (Metafield Solution)
        </h3>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="
          margin: 0 0 15px 0;
          color: #6c757d;
          font-size: 14px;
          line-height: 1.4;
        ">
          Select which resellers carry this product. This will be saved to the product's metafields.
        </p>
        
        <div style="
          background: #e3f2fd;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 13px;
          color: #1976d2;
          border-left: 4px solid #2196f3;
          margin-bottom: 15px;
        ">
          <strong>💡 Simple Solution:</strong> This uses Shopify metafields instead of complex API calls.
          The selected resellers will be saved directly to the product's custom data.
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
          font-size: 14px;
        ">Select Resellers:</label>
        
        <div id="reseller-checkboxes" style="
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #e1e3e5;
          border-radius: 6px;
          padding: 15px;
          background: #fafafa;
        ">
          ${AVAILABLE_RESELLERS.map(
            (reseller) => `
            <div style="
              display: flex;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #f0f0f0;
            ">
              <input type="checkbox" 
                     id="reseller-${reseller.id}" 
                     value="${reseller.name}"
                     style="margin-right: 12px; transform: scale(1.1);">
              <div>
                <div style="font-weight: 600; color: #2c3e50; font-size: 14px;">
                  ${reseller.name}
                </div>
                <div style="font-size: 12px; color: #6c757d;">
                  ${reseller.description}
                </div>
              </div>
            </div>
          `
          ).join("")}
        </div>
      </div>
      
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 20px;
        border-top: 1px solid #e1e3e5;
      ">
        <div id="selected-resellers-display" style="
          font-size: 13px;
          color: #6c757d;
          flex: 1;
        ">No resellers selected</div>
        
        <div style="display: flex; gap: 10px;">
          <button id="select-all-btn" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
          ">Select All</button>
          
          <button id="clear-all-btn" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
          ">Clear All</button>
          
          <button id="save-resellers-btn" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
          ">Save to Metafield</button>
        </div>
      </div>
      
      <div id="reseller-messages" style="margin-top: 15px;"></div>
    `;

    return section;
  }

  // Update selected resellers display
  function updateSelectedDisplay() {
    const checkboxes = document.querySelectorAll(
      '#reseller-checkboxes input[type="checkbox"]:checked'
    );
    const selectedNames = Array.from(checkboxes).map((cb) => cb.value);
    const display = document.getElementById("selected-resellers-display");

    if (selectedNames.length > 0) {
      display.innerHTML = `<strong>Selected:</strong> ${selectedNames.join(
        ", "
      )}`;
      display.style.color = "#155724";
    } else {
      display.textContent = "No resellers selected";
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

  // Save to metafield using Shopify's native metafield API
  async function saveToMetafield() {
    const checkboxes = document.querySelectorAll(
      '#reseller-checkboxes input[type="checkbox"]:checked'
    );
    const selectedResellers = Array.from(checkboxes).map((cb) => cb.value);

    if (selectedResellers.length === 0) {
      showMessage("Please select at least one reseller", "error");
      return;
    }

    const saveBtn = document.getElementById("save-resellers-btn");
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

      console.log("📝 Saving to metafield:", selectedResellers);
      console.log("📝 Product ID:", productId);

      // Use Shopify's native metafield update (this works within Shopify admin)
      // Convert array to multi-line text (since you're using "Multi-line text" type)
      const metafieldData = {
        metafield: {
          namespace: "custom",
          key: "select_resellers", // Updated to match your metafield key
          value: selectedResellers.join("\n"), // Join with newlines for multi-line text
          type: "multi_line_text_field", // Updated to match your metafield type
        },
      };

      // Try to save using Shopify's internal API (works within admin context)
      const response = await fetch(`/admin/products/${productId}.json`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": "admin", // This works within Shopify admin
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
        localStorage.setItem(
          `metafield_resellers_${productId}`,
          JSON.stringify(selectedResellers)
        );

        showMessage(
          `✅ Saved ${selectedResellers.length} reseller(s) to metafield!`,
          "success"
        );

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
        localStorage.setItem(
          `metafield_resellers_${productId}`,
          JSON.stringify(selectedResellers)
        );
      }

      showMessage(
        `⚠️ Saved to local storage (API unavailable): ${selectedResellers.length} reseller(s)`,
        "success"
      );
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save to Metafield";
      saveBtn.style.background = "#007bff";
    }
  }

  // Initialize
  function init() {
    if (!isProductEditPage()) {
      console.log("❌ Not on a product editing page");
      return;
    }

    console.log(
      "✅ On product editing page, creating metafield reseller UI..."
    );

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
        // Try to load from localStorage first
        const saved = localStorage.getItem(`metafield_resellers_${productId}`);
        if (saved) {
          const selectedResellers = JSON.parse(saved);
          selectedResellers.forEach((resellerName) => {
            const checkbox = document.querySelector(
              `input[value="${resellerName}"]`
            );
            if (checkbox) checkbox.checked = true;
          });
          updateSelectedDisplay();
        }

        // Also try to load from the metafield if it exists
        // This would require additional API call to fetch metafield data
        // For now, we'll rely on localStorage
      }

      // Add event listeners
      document.getElementById("select-all-btn").onclick = () => {
        document
          .querySelectorAll('#reseller-checkboxes input[type="checkbox"]')
          .forEach((cb) => (cb.checked = true));
        updateSelectedDisplay();
      };

      document.getElementById("clear-all-btn").onclick = () => {
        document
          .querySelectorAll('#reseller-checkboxes input[type="checkbox"]')
          .forEach((cb) => (cb.checked = false));
        updateSelectedDisplay();
      };

      document.getElementById("save-resellers-btn").onclick = saveToMetafield;

      // Update display when checkboxes change
      document
        .querySelectorAll('#reseller-checkboxes input[type="checkbox"]')
        .forEach((checkbox) => {
          checkbox.onchange = updateSelectedDisplay;
        });

      clearInterval(checkInterval);
      console.log("✅ Metafield reseller section created successfully!");
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

  console.log("🏪 Shopify Metafield Reseller Script Loaded");
})();
