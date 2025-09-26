// Shopify Admin Reseller Selection Script
// This script adds reseller selection directly to Shopify admin product pages

(function () {
  "use strict";

  console.log("🏪 Shopify Admin Reseller Script Loading...");

  // Configuration
  // Point this to your deployed app base URL (used from within Shopify Admin)
  const API_BASE_URL =
    window.__APP_BASE_URL ||
    "https://shopify-reseller-app-production.up.railway.app";
  const RESELLER_SECTION_ID = "shopify-reseller-selection";

  // Check if we're on a product editing page
  function isProductEditPage() {
    const path = window.location.pathname;
    return (
      path.includes("/admin/products/") &&
      (path.includes("/edit") || path.match(/\/admin\/products\/\d+$/))
    );
  }

  // Wait for element with timeout
  function waitForElement(selector, callback, timeout = 10000) {
    const startTime = Date.now();

    function check() {
      const element = document.querySelector(selector);
      if (element) {
        callback(element);
      } else if (Date.now() - startTime < timeout) {
        setTimeout(check, 100);
      } else {
        console.warn("⏰ Timeout waiting for element:", selector);
      }
    }
    check();
  }

  // Create the reseller selection UI
  function createResellerUI() {
    const section = document.createElement("div");
    section.id = RESELLER_SECTION_ID;
    section.style.cssText = `
            background: white;
            border: 1px solid #e1e3e5;
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
                <h2 style="
                    margin: 0;
                    color: #2c3e50;
                    font-size: 18px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    🏪 Select Resellers for This Product
                </h2>
                <div style="display: flex; gap: 8px;">
                    <button id="select-all-resellers-btn" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                    ">Select All</button>
                    <button id="clear-all-resellers-btn" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                    ">Clear All</button>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <p style="
                    margin: 0 0 15px 0;
                    color: #6c757d;
                    font-size: 14px;
                    line-height: 1.4;
                ">
                    Choose which resellers carry this product. You can select multiple resellers.
                </p>
                <div id="selected-count-display" style="
                    background: #e3f2fd;
                    padding: 12px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    color: #1976d2;
                    font-weight: 500;
                    border-left: 4px solid #2196f3;
                ">0 reseller(s) selected</div>
            </div>
            
            <div id="reseller-checkboxes-container" style="
                max-height: 400px;
                overflow-y: auto;
                margin-bottom: 20px;
                border: 1px solid #e1e3e5;
                border-radius: 6px;
                padding: 15px;
                background: #fafafa;
            ">
                <div style="text-align: center; padding: 40px; color: #6c757d;">
                    <div style="font-size: 16px; margin-bottom: 8px;">Loading resellers...</div>
                    <div style="font-size: 14px;">Please wait while we fetch your reseller data.</div>
                </div>
            </div>
            
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 20px;
                border-top: 1px solid #e1e3e5;
            ">
                <div id="selected-resellers-preview" style="
                    font-size: 13px;
                    color: #6c757d;
                    flex: 1;
                    line-height: 1.4;
                "></div>
                <button id="save-resellers-btn" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow: 0 2px 4px rgba(0,123,255,0.3);
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='#0056b3'" onmouseout="this.style.background='#007bff'">
                    Save Reseller Selection
                </button>
            </div>
            
            <div id="reseller-messages" style="margin-top: 15px;"></div>
        `;

    return section;
  }

  // Global state
  let allResellers = [];
  let selectedResellers = [];
  let currentProductId = null;

  // Get product ID from URL
  function getProductId() {
    const path = window.location.pathname;
    const match = path.match(/\/admin\/products\/(\d+)/);
    return match ? match[1] : null;
  }

  // Load resellers from API
  async function loadResellers() {
    try {
      console.log("📡 Loading resellers from API...");
      const response = await fetch(`${API_BASE_URL}/api/resellers`);
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const resellers = await response.json();
      console.log("✅ Loaded resellers:", resellers.length);
      return resellers;
    } catch (error) {
      console.error("❌ Error loading resellers:", error);
      showMessage("Error loading resellers: " + error.message, "error");
      return [];
    }
  }

  // Load product resellers from metafield custom.select_resellers (type json)
  async function loadProductResellers(productId) {
    try {
      console.log("📡 Loading product metafields for product:", productId);
      const response = await fetch(
        `${API_BASE_URL}/api/products/${productId}/metafields`
      );
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const metafields = await response.json();
      const mf = metafields.find(
        (m) => m.namespace === "custom" && m.key === "select_resellers"
      );
      if (!mf || !mf.value) {
        console.log("ℹ️ No reseller metafield set yet");
        return [];
      }

      let parsed;
      try {
        parsed = typeof mf.value === "string" ? JSON.parse(mf.value) : mf.value;
      } catch (e) {
        console.warn(
          "⚠️ Could not parse metafield value, expected JSON array of IDs. Value:",
          mf.value
        );
        return [];
      }

      // Support either array of IDs or array of objects {id}
      const resellerIds = Array.isArray(parsed)
        ? parsed
            .map((v) => (typeof v === "object" && v !== null ? v.id : v))
            .filter(Boolean)
        : [];
      console.log(
        "✅ Loaded product reseller IDs from metafield:",
        resellerIds
      );
      return resellerIds;
    } catch (error) {
      console.error("❌ Error loading product metafield resellers:", error);
      return [];
    }
  }

  // Save product resellers to metafield custom.select_resellers (type json)
  async function saveProductResellers(productId, resellerIds) {
    try {
      console.log(
        "💾 Saving reseller IDs to metafield for product:",
        productId,
        resellerIds
      );
      const response = await fetch(
        `${API_BASE_URL}/api/products/${productId}/metafields`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            namespace: "custom",
            key: "select_resellers",
            value: resellerIds,
            type: "json",
          }),
        }
      );

      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      console.log("✅ Successfully saved resellers to metafield");
      return true;
    } catch (error) {
      console.error("❌ Error saving resellers to metafield:", error);
      throw error;
    }
  }

  // Render reseller checkboxes
  function renderResellerCheckboxes(resellers, selectedIds) {
    const container = document.getElementById("reseller-checkboxes-container");
    if (!container) return;

    if (resellers.length === 0) {
      container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6c757d;">
                    <div style="font-size: 16px; margin-bottom: 8px;">No resellers available</div>
                    <div style="font-size: 14px;">Add some resellers first in the reseller management section.</div>
                </div>
            `;
      return;
    }

    container.innerHTML = resellers
      .map((reseller) => {
        const isSelected = selectedIds.includes(reseller.id);
        return `
                <div style="
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    border: 1px solid ${isSelected ? "#007bff" : "#e1e3e5"};
                    border-radius: 6px;
                    margin-bottom: 10px;
                    background: ${isSelected ? "#f0f8ff" : "white"};
                    transition: all 0.2s ease;
                    cursor: pointer;
                " onclick="toggleResellerSelection(${reseller.id})" 
                   onmouseover="this.style.borderColor='#007bff'" 
                   onmouseout="this.style.borderColor='${
                     isSelected ? "#007bff" : "#e1e3e5"
                   }'">
                    <input type="checkbox" 
                           style="margin-right: 15px; transform: scale(1.2);"
                           ${isSelected ? "checked" : ""}
                           onchange="toggleResellerSelection(${reseller.id})">
                    <div style="flex: 1;">
                        <div style="
                            font-weight: 600; 
                            color: #2c3e50; 
                            margin-bottom: 4px;
                            font-size: 15px;
                        ">${reseller.name}</div>
                        ${
                          reseller.description
                            ? `
                            <div style="
                                font-size: 13px; 
                                color: #6c757d; 
                                margin-bottom: 4px;
                            ">${reseller.description}</div>
                        `
                            : ""
                        }
                        ${
                          reseller.website_url
                            ? `
                            <div style="font-size: 12px; color: #007bff;">
                                🌐 ${reseller.website_url}
                            </div>
                        `
                            : ""
                        }
                    </div>
                    ${
                      reseller.logo_url
                        ? `
                        <img src="${reseller.logo_url}" 
                             alt="${reseller.name}" 
                             style="
                                width: 40px; 
                                height: 40px; 
                                border-radius: 6px; 
                                object-fit: cover;
                                border: 1px solid #e1e3e5;
                             " 
                             onerror="this.style.display='none'">
                    `
                        : ""
                    }
                </div>
            `;
      })
      .join("");
  }

  // Update selected count display
  function updateSelectedDisplay(selectedIds, resellers) {
    const count = selectedIds.length;
    const countDisplay = document.getElementById("selected-count-display");
    const preview = document.getElementById("selected-resellers-preview");

    if (countDisplay) {
      countDisplay.textContent = `${count} reseller(s) selected`;
      countDisplay.style.background = count > 0 ? "#d4edda" : "#e3f2fd";
      countDisplay.style.color = count > 0 ? "#155724" : "#1976d2";
      countDisplay.style.borderLeftColor = count > 0 ? "#28a745" : "#2196f3";
    }

    if (preview && count > 0) {
      const selectedNames = selectedIds
        .map((id) => {
          const reseller = resellers.find((r) => r.id === id);
          return reseller ? reseller.name : "";
        })
        .filter(Boolean);
      preview.innerHTML = `<strong>Selected:</strong> ${selectedNames.join(
        ", "
      )}`;
    } else if (preview) {
      preview.innerHTML = "";
    }
  }

  // Show message
  function showMessage(message, type) {
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

    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }

  // Toggle reseller selection
  window.toggleResellerSelection = function (resellerId) {
    const index = selectedResellers.indexOf(resellerId);
    if (index > -1) {
      selectedResellers.splice(index, 1);
    } else {
      selectedResellers.push(resellerId);
    }

    renderResellerCheckboxes(allResellers, selectedResellers);
    updateSelectedDisplay(selectedResellers, allResellers);
  };

  // Event listeners
  document.addEventListener("click", function (e) {
    if (e.target.id === "select-all-resellers-btn") {
      selectedResellers = allResellers.map((r) => r.id);
      renderResellerCheckboxes(allResellers, selectedResellers);
      updateSelectedDisplay(selectedResellers, allResellers);
      showMessage("All resellers selected", "success");
    }

    if (e.target.id === "clear-all-resellers-btn") {
      selectedResellers = [];
      renderResellerCheckboxes(allResellers, selectedResellers);
      updateSelectedDisplay(selectedResellers, allResellers);
      showMessage("All resellers cleared", "success");
    }

    if (e.target.id === "save-resellers-btn") {
      saveResellers();
    }
  });

  // Save resellers
  async function saveResellers() {
    if (!currentProductId) {
      showMessage("No product ID found", "error");
      return;
    }

    const saveBtn = document.getElementById("save-resellers-btn");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
      saveBtn.style.background = "#6c757d";
    }

    try {
      await saveProductResellers(currentProductId, selectedResellers);
      showMessage(
        `Successfully updated resellers for this product!`,
        "success"
      );
    } catch (error) {
      showMessage("Error saving resellers: " + error.message, "error");
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Reseller Selection";
        saveBtn.style.background = "#007bff";
      }
    }
  }

  // Initialize the reseller selection
  async function initialize() {
    console.log("🚀 Initializing Shopify Admin Reseller Selection...");

    // Get product ID
    currentProductId = getProductId();
    if (!currentProductId) {
      console.error("❌ Could not determine product ID from URL");
      showMessage("Could not determine product ID from URL", "error");
      return;
    }

    console.log("✅ Product ID:", currentProductId);

    // Load data
    console.log("📡 Loading resellers and product data...");
    const [resellers, productResellers] = await Promise.all([
      loadResellers(),
      loadProductResellers(currentProductId),
    ]);

    allResellers = resellers;
    selectedResellers = productResellers;

    console.log("✅ Data loaded:", {
      resellers: resellers.length,
      selected: selectedResellers.length,
    });

    // Render the interface
    renderResellerCheckboxes(allResellers, selectedResellers);
    updateSelectedDisplay(selectedResellers, allResellers);
  }

  // Main initialization
  function init() {
    console.log("🔍 Checking if we should initialize...");
    console.log("Current URL:", window.location.href);
    console.log("Is product edit page:", isProductEditPage());

    if (!isProductEditPage()) {
      console.log("❌ Not on a product editing page, skipping initialization");
      return;
    }

    console.log("✅ On product editing page, starting initialization...");

    // Wait for the page to be fully loaded
    waitForElement("body", function () {
      // Check if reseller section already exists
      if (document.getElementById(RESELLER_SECTION_ID)) {
        console.log("❌ Reseller section already exists, skipping");
        return;
      }

      // Find insertion point
      let insertionPoint = document.body;

      // Try to find a better insertion point
      const possiblePoints = [
        ".Polaris-Page__Content",
        ".admin-content",
        ".product-details",
        ".product-editor",
        ".product-form-container",
        "main",
        ".content",
      ];

      for (const selector of possiblePoints) {
        const element = document.querySelector(selector);
        if (element) {
          insertionPoint = element;
          console.log("✅ Found insertion point:", selector);
          break;
        }
      }

      // Create and insert the reseller section
      console.log("🏗️ Creating reseller section...");
      const resellerSection = createResellerUI();
      insertionPoint.appendChild(resellerSection);

      console.log("✅ Reseller section created and inserted");

      // Initialize the functionality
      initialize();
    });
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  console.log("🏪 Shopify Admin Reseller Script Loaded");
})();
