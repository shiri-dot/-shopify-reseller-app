// Shopify Reseller Extension - Multi-Select Content Script
// This automatically adds multi-select reseller selection to product pages

(function () {
  "use strict";

  console.log("🏪 Shopify Multi-Select Reseller Extension Loading...");

  // Configuration
  const RESELLER_SECTION_ID = "extension-multiselect-reseller";
  const AVAILABLE_RESELLERS = [
    "Reseller A",
    "Reseller B",
    "Reseller C",
    "Reseller D",
    "Reseller E",
    "Reseller F",
  ];

  // Check if we're on a product editing page
  function isProductEditPage() {
    const path = window.location.pathname;
    return (
      path.includes("/admin/products/") &&
      (path.includes("/edit") || path.match(/\/admin\/products\/\d+$/))
    );
  }

  // Create the multi-select reseller UI
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
      position: relative;
      z-index: 1000;
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
          🏪 Select Resellers (Multi-Select)
        </h3>
        <div style="
          background: #007bff;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
        ">EXTENSION</div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="
          margin: 0 0 15px 0;
          color: #6c757d;
          font-size: 14px;
          line-height: 1.4;
        ">
          Choose which resellers carry this product. You can select multiple resellers. This will be saved to the product's metafield.
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
          <strong>🚀 Auto-Loaded:</strong> This extension automatically adds multi-select reseller functionality to all product pages.
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        ">
          <label style="
            font-weight: 600;
            color: #2c3e50;
            font-size: 14px;
          ">Available Resellers:</label>
          
          <div style="display: flex; gap: 8px;">
            <button id="extension-select-all" style="
              background: #28a745;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 500;
            ">Select All</button>
            
            <button id="extension-clear-all" style="
              background: #dc3545;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 500;
            ">Clear All</button>
          </div>
        </div>
        
        <div id="extension-reseller-checkboxes" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 15px;
        ">
          ${AVAILABLE_RESELLERS.map(
            (reseller, index) => `
            <div style="
              display: flex;
              align-items: center;
              padding: 10px;
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 6px;
              transition: all 0.2s ease;
              cursor: pointer;
            " data-reseller="${reseller}">
              <input type="checkbox" 
                     id="extension-reseller-${index}" 
                     value="${reseller}" 
                     style="
                       margin-right: 10px;
                       transform: scale(1.2);
                       cursor: pointer;
                     ">
              <label for="extension-reseller-${index}" style="
                cursor: pointer;
                font-size: 14px;
                color: #495057;
                flex: 1;
                margin: 0;
              ">${reseller}</label>
            </div>
          `
          ).join("")}
        </div>
        
        <div id="extension-selected-count" style="
          text-align: center;
          font-size: 14px;
          color: #6c757d;
          margin-bottom: 15px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        ">Selected: 0 of ${AVAILABLE_RESELLERS.length} resellers</div>
      </div>
      
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 20px;
        border-top: 1px solid #e1e3e5;
      ">
        <div id="extension-selected-resellers" style="
          font-size: 13px;
          color: #6c757d;
          flex: 1;
        ">No resellers selected</div>
        
        <div style="display: flex; gap: 10px;">
          <button id="extension-clear-resellers" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
          ">Clear</button>
          
          <button id="extension-save-resellers" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
          ">Save Resellers</button>
        </div>
      </div>
      
      <div id="extension-reseller-messages" style="margin-top: 15px;"></div>
    `;

    return section;
  }

  // Update selected resellers display
  function updateSelectedDisplay() {
    const checkboxes = document.querySelectorAll(
      "#extension-reseller-checkboxes input[type='checkbox']"
    );
    const selectedResellers = Array.from(checkboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);

    const count = selectedResellers.length;
    const countDisplay = document.getElementById("extension-selected-count");
    const resellersDisplay = document.getElementById(
      "extension-selected-resellers"
    );

    // Update count
    countDisplay.textContent = `Selected: ${count} of ${AVAILABLE_RESELLERS.length} resellers`;
    if (count > 0) {
      countDisplay.style.color = "#28a745";
      countDisplay.style.fontWeight = "600";
      countDisplay.style.background = "#d4edda";
    } else {
      countDisplay.style.color = "#6c757d";
      countDisplay.style.fontWeight = "normal";
      countDisplay.style.background = "#f8f9fa";
    }

    // Update selected list
    if (selectedResellers.length > 0) {
      resellersDisplay.innerHTML = `<strong>Selected:</strong> ${selectedResellers.join(
        ", "
      )}`;
      resellersDisplay.style.color = "#155724";
    } else {
      resellersDisplay.textContent = "No resellers selected";
      resellersDisplay.style.color = "#6c757d";
    }

    // Update checkbox container styles
    const checkboxContainers = document.querySelectorAll(
      "#extension-reseller-checkboxes > div"
    );
    checkboxContainers.forEach((container) => {
      const checkbox = container.querySelector("input[type='checkbox']");
      if (checkbox.checked) {
        container.style.background = "#d4edda";
        container.style.borderColor = "#28a745";
      } else {
        container.style.background = "#f8f9fa";
        container.style.borderColor = "#dee2e6";
      }
    });
  }

  // Show message
  function showMessage(message, type = "success") {
    const messagesDiv = document.getElementById("extension-reseller-messages");
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
  async function saveResellers() {
    const checkboxes = document.querySelectorAll(
      "#extension-reseller-checkboxes input[type='checkbox']"
    );
    const selectedResellers = Array.from(checkboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);

    if (selectedResellers.length === 0) {
      showMessage("Please select at least one reseller", "error");
      return;
    }

    const saveBtn = document.getElementById("extension-save-resellers");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    saveBtn.style.background = "#6c757d";

    try {
      const productId = window.location.pathname.match(
        /\/admin\/products\/(\d+)/
      )?.[1];

      if (!productId) {
        throw new Error("Could not determine product ID");
      }

      console.log("📝 Saving resellers via extension:", selectedResellers);

      // Join reseller names with newlines for multi-line text field
      const resellerText = selectedResellers.join("\n");

      // Save to metafield
      const metafieldData = {
        metafield: {
          namespace: "custom",
          key: "select_resellers",
          value: resellerText,
          type: "multi_line_text_field",
        },
      };

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
        localStorage.setItem(
          `extension_resellers_${productId}`,
          JSON.stringify(selectedResellers)
        );
        showMessage(
          `✅ Saved ${selectedResellers.length} reseller(s) to metafield!`,
          "success"
        );
        console.log("✅ Extension saved to metafield successfully!");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ Extension save error:", error);

      const productId = window.location.pathname.match(
        /\/admin\/products\/(\d+)/
      )?.[1];

      if (productId) {
        localStorage.setItem(
          `extension_resellers_${productId}`,
          JSON.stringify(selectedResellers)
        );
      }

      showMessage(
        `⚠️ Saved to local storage (API unavailable): ${selectedResellers.length} reseller(s)`,
        "success"
      );
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Resellers";
      saveBtn.style.background = "#007bff";
    }
  }

  // Load saved resellers
  function loadSavedResellers() {
    const productId = window.location.pathname.match(
      /\/admin\/products\/(\d+)/
    )?.[1];

    if (!productId) return;

    const saved = localStorage.getItem(`extension_resellers_${productId}`);
    if (saved) {
      try {
        const savedResellers = JSON.parse(saved);
        const checkboxes = document.querySelectorAll(
          "#extension-reseller-checkboxes input[type='checkbox']"
        );

        checkboxes.forEach((checkbox) => {
          checkbox.checked = savedResellers.includes(checkbox.value);
        });

        updateSelectedDisplay();
        console.log("📥 Loaded saved resellers:", savedResellers);
      } catch (error) {
        console.error("❌ Error loading saved resellers:", error);
      }
    }
  }

  // Initialize
  function init() {
    if (!isProductEditPage()) {
      console.log("❌ Not on a product editing page");
      return;
    }

    console.log(
      "✅ Extension: On product editing page, creating multi-select reseller UI..."
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
      loadSavedResellers();

      // Add event listeners
      const checkboxes = document.querySelectorAll(
        "#extension-reseller-checkboxes input[type='checkbox']"
      );
      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", updateSelectedDisplay);
      });

      // Add click listeners to containers for better UX
      const containers = document.querySelectorAll(
        "#extension-reseller-checkboxes > div"
      );
      containers.forEach((container) => {
        container.addEventListener("click", (e) => {
          if (e.target.type !== "checkbox") {
            const checkbox = container.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
            updateSelectedDisplay();
          }
        });
      });

      document.getElementById("extension-select-all").onclick = () => {
        checkboxes.forEach((checkbox) => (checkbox.checked = true));
        updateSelectedDisplay();
      };

      document.getElementById("extension-clear-all").onclick = () => {
        checkboxes.forEach((checkbox) => (checkbox.checked = false));
        updateSelectedDisplay();
      };

      document.getElementById("extension-clear-resellers").onclick = () => {
        checkboxes.forEach((checkbox) => (checkbox.checked = false));
        updateSelectedDisplay();
      };

      document.getElementById("extension-save-resellers").onclick =
        saveResellers;

      clearInterval(checkInterval);
      console.log(
        "✅ Extension multi-select reseller section created successfully!"
      );
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

  console.log("🏪 Shopify Multi-Select Reseller Extension Loaded");
})();
