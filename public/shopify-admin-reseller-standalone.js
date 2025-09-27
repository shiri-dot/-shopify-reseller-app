// Standalone Shopify Admin Reseller Script (No API Required)
// This version works without needing a deployed backend

(function () {
  "use strict";

  console.log("🏪 Standalone Shopify Admin Reseller Script Loading...");

  // Configuration
  const RESELLER_SECTION_ID = "shopify-reseller-selection-standalone";

  // Mock reseller data for testing
  const MOCK_RESELLERS = [
    {
      id: 1,
      name: "Reseller A",
      description: "Test reseller for demonstration",
      website_url: "https://example.com",
      logo_url: null,
    },
    {
      id: 2,
      name: "Reseller B",
      description: "Another test reseller",
      website_url: "https://example.com",
      logo_url: null,
    },
    {
      id: 3,
      name: "Reseller C",
      description: "Third test reseller",
      website_url: "https://example.com",
      logo_url: null,
    },
  ];

  // Check if we're on a product editing page
  function isProductEditPage() {
    const path = window.location.pathname;
    const isProductPage = path.includes("/admin/products/");
    const isEditPage =
      path.includes("/edit") || path.match(/\/admin\/products\/\d+$/);
    const result = isProductPage && isEditPage;

    console.log("🔍 Page Detection Debug:", {
      path: path,
      isProductPage: isProductPage,
      isEditPage: isEditPage,
      result: result,
    });

    return result;
  }

  // Create the reseller selection UI
  function createResellerUI() {
    const section = document.createElement("div");
    section.id = RESELLER_SECTION_ID;
    section.style.cssText = `
      background: white;
      border: 3px solid #28a745;
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
        <h2 style="
          margin: 0;
          color: #2c3e50;
          font-size: 18px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          🏪 Select Resellers for This Product (STANDALONE MODE)
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
          <strong>Note: This is standalone mode using mock data for testing.</strong>
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
          background: #28a745;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(40,167,69,0.3);
          transition: all 0.2s ease;
        " onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">
          Save Reseller Selection (Mock)
        </button>
      </div>
      
      <div id="reseller-messages" style="margin-top: 15px;"></div>
    `;

    return section;
  }

  // Global state
  let allResellers = MOCK_RESELLERS;
  let selectedResellers = [];
  let currentProductId = null;

  // Get product ID from URL
  function getProductId() {
    const path = window.location.pathname;
    const match = path.match(/\/admin\/products\/(\d+)/);
    return match ? match[1] : null;
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
            border: 1px solid ${isSelected ? "#28a745" : "#e1e3e5"};
            border-radius: 6px;
            margin-bottom: 10px;
            background: ${isSelected ? "#f0fff4" : "white"};
            transition: all 0.2s ease;
            cursor: pointer;
          " onclick="toggleResellerSelection(${reseller.id})" 
             onmouseover="this.style.borderColor='#28a745'" 
             onmouseout="this.style.borderColor='${
               isSelected ? "#28a745" : "#e1e3e5"
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
                  <div style="font-size: 12px; color: #28a745;">
                    🌐 ${reseller.website_url}
                  </div>
              `
                  : ""
              }
            </div>
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

  // Save resellers (mock)
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
      // Mock save - in real implementation this would call your API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Store in localStorage for demo purposes
      localStorage.setItem(
        `resellers_${currentProductId}`,
        JSON.stringify(selectedResellers)
      );

      showMessage(
        `Successfully saved ${selectedResellers.length} reseller(s) for this product! (Mock Save)`,
        "success"
      );
    } catch (error) {
      showMessage("Error saving resellers: " + error.message, "error");
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Reseller Selection (Mock)";
        saveBtn.style.background = "#28a745";
      }
    }
  }

  // Initialize the reseller selection
  async function initialize() {
    console.log(
      "🚀 Initializing Standalone Shopify Admin Reseller Selection..."
    );

    // Get product ID
    currentProductId = getProductId();
    if (!currentProductId) {
      console.error("❌ Could not determine product ID from URL");
      showMessage("Could not determine product ID from URL", "error");
      return;
    }

    console.log("✅ Product ID:", currentProductId);

    // Load saved resellers from localStorage
    const savedResellers = localStorage.getItem(
      `resellers_${currentProductId}`
    );
    if (savedResellers) {
      selectedResellers = JSON.parse(savedResellers);
      console.log("✅ Loaded saved resellers:", selectedResellers);
    }

    console.log("✅ Using mock resellers:", allResellers.length);

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

    // Wait for the page to be fully loaded with multiple attempts
    let attempts = 0;
    const maxAttempts = 50;

    function tryInitialize() {
      attempts++;
      console.log(`🔄 Initialization attempt ${attempts}/${maxAttempts}`);

      // Check if reseller section already exists
      if (document.getElementById(RESELLER_SECTION_ID)) {
        console.log("❌ Reseller section already exists, skipping");
        return;
      }

      // Find insertion point with more comprehensive selectors
      let insertionPoint = document.body;
      const possiblePoints = [
        ".Polaris-Page__Content",
        ".admin-content",
        ".product-details",
        ".product-editor",
        ".product-form-container",
        ".product-form",
        ".product-edit",
        "[data-testid='product-form']",
        ".product-page",
        "main",
        ".content",
        ".app",
        "#AppFrameMain",
      ];

      console.log("🔍 Looking for insertion points...");
      for (const selector of possiblePoints) {
        const element = document.querySelector(selector);
        if (element) {
          insertionPoint = element;
          console.log("✅ Found insertion point:", selector, element);
          break;
        }
      }

      // If we found a good insertion point or this is our last attempt, proceed
      if (insertionPoint !== document.body || attempts >= maxAttempts) {
        console.log("🏗️ Creating reseller section...");
        const resellerSection = createResellerUI();

        insertionPoint.appendChild(resellerSection);
        console.log(
          "✅ Reseller section created and inserted at:",
          insertionPoint
        );

        // Initialize the functionality
        initialize();
      } else if (attempts < maxAttempts) {
        // Wait a bit more and try again
        setTimeout(tryInitialize, 500);
      } else {
        console.error(
          "❌ Failed to find suitable insertion point after",
          maxAttempts,
          "attempts"
        );
        // Fallback: insert at body anyway
        console.log("🏗️ Creating reseller section as fallback...");
        const resellerSection = createResellerUI();
        document.body.appendChild(resellerSection);
        initialize();
      }
    }

    // Start the initialization process
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", tryInitialize);
    } else {
      tryInitialize();
    }
  }

  // Manual trigger function for debugging
  window.triggerStandaloneResellerInit = function () {
    console.log("🚀 Manual standalone trigger called");
    init();
  };

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  console.log("🏪 Standalone Shopify Admin Reseller Script Loaded");
  console.log("📍 Current URL:", window.location.href);
  console.log("🔧 Script version: Standalone Mode 1.0");
})();
