// Shopify Multi-Select Reseller Script
// Shows all resellers and allows multiple selection per product

console.log("🔄 Loading Shopify Multi-Select Reseller Script...");

// Available resellers - replace with your actual reseller list
const AVAILABLE_RESELLERS = [
  "Reseller A",
  "Reseller B",
  "Reseller C",
  "Reseller D",
  "Reseller E",
  "Reseller F",
];

// Configuration
const CONFIG = {
  metafieldNamespace: "custom",
  metafieldKey: "select_resellers",
  metafieldType: "multi_line_text_field",
  containerId: "reseller-multiselect-container",
  containerClass: "reseller-multiselect-section",
};

// Utility functions
function isProductEditPage() {
  const url = window.location.href;
  const isEditPage =
    url.includes("/products/") &&
    (url.includes("/edit") || url.includes("?view=edit"));
  console.log("🔍 Page detection:", { url, isEditPage });
  return isEditPage;
}

function getProductId() {
  const url = window.location.href;
  const match = url.match(/\/products\/(\d+)/);
  const productId = match ? match[1] : null;
  console.log("🆔 Product ID extracted:", productId);
  return productId;
}

function createResellerMultiSelectUI() {
  console.log("🎨 Creating multi-select reseller UI...");

  // Create container
  const container = document.createElement("div");
  container.id = CONFIG.containerId;
  container.className = CONFIG.containerClass;
  container.style.cssText = `
        margin: 20px 0;
        padding: 20px;
        border: 2px solid #007cba;
        border-radius: 8px;
        background: #f8f9fa;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

  // Create header
  const header = document.createElement("div");
  header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #ddd;
    `;

  const title = document.createElement("h3");
  title.textContent = "🏪 Select Resellers for this Product";
  title.style.cssText = `
        margin: 0;
        color: #333;
        font-size: 16px;
        font-weight: 600;
    `;

  const status = document.createElement("span");
  status.id = "reseller-status";
  status.style.cssText = `
        font-size: 12px;
        color: #666;
        background: #e9ecef;
        padding: 4px 8px;
        border-radius: 4px;
    `;

  header.appendChild(title);
  header.appendChild(status);

  // Create controls
  const controls = document.createElement("div");
  controls.style.cssText = `
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
        flex-wrap: wrap;
    `;

  const selectAllBtn = document.createElement("button");
  selectAllBtn.textContent = "Select All";
  selectAllBtn.style.cssText = `
        padding: 6px 12px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    `;

  const clearAllBtn = document.createElement("button");
  clearAllBtn.textContent = "Clear All";
  clearAllBtn.style.cssText = `
        padding: 6px 12px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    `;

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "💾 Save Resellers";
  saveBtn.style.cssText = `
        padding: 8px 16px;
        background: #007cba;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
    `;

  controls.appendChild(selectAllBtn);
  controls.appendChild(clearAllBtn);
  controls.appendChild(saveBtn);

  // Create reseller checkboxes container
  const checkboxesContainer = document.createElement("div");
  checkboxesContainer.id = "reseller-checkboxes";
  checkboxesContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
        margin-bottom: 15px;
    `;

  // Create checkboxes for each reseller
  AVAILABLE_RESELLERS.forEach((reseller, index) => {
    const checkboxWrapper = document.createElement("div");
    checkboxWrapper.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            transition: all 0.2s ease;
        `;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `reseller-${index}`;
    checkbox.value = reseller;
    checkbox.style.cssText = `
            margin-right: 8px;
            transform: scale(1.2);
        `;

    const label = document.createElement("label");
    label.htmlFor = `reseller-${index}`;
    label.textContent = reseller;
    label.style.cssText = `
            cursor: pointer;
            font-size: 14px;
            color: #333;
            flex: 1;
        `;

    // Add hover effect
    checkboxWrapper.addEventListener("mouseenter", () => {
      checkboxWrapper.style.background = "#f0f8ff";
      checkboxWrapper.style.borderColor = "#007cba";
    });

    checkboxWrapper.addEventListener("mouseleave", () => {
      checkboxWrapper.style.background = "white";
      checkboxWrapper.style.borderColor = "#ddd";
    });

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(label);
    checkboxesContainer.appendChild(checkboxWrapper);
  });

  // Create selected count display
  const selectedCount = document.createElement("div");
  selectedCount.id = "selected-count";
  selectedCount.style.cssText = `
        text-align: center;
        font-size: 14px;
        color: #666;
        margin-bottom: 10px;
    `;

  // Assemble container
  container.appendChild(header);
  container.appendChild(controls);
  container.appendChild(selectedCount);
  container.appendChild(checkboxesContainer);

  // Event listeners
  selectAllBtn.addEventListener("click", () => {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => (checkbox.checked = true));
    updateSelectedCount();
    updateStatus("All resellers selected");
  });

  clearAllBtn.addEventListener("click", () => {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => (checkbox.checked = false));
    updateSelectedCount();
    updateStatus("All resellers cleared");
  });

  saveBtn.addEventListener("click", () => {
    saveSelectedResellers();
  });

  // Add change listeners to all checkboxes
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", updateSelectedCount);
  });

  function updateSelectedCount() {
    const checkedBoxes = container.querySelectorAll(
      'input[type="checkbox"]:checked'
    );
    const count = checkedBoxes.length;
    selectedCount.textContent = `Selected: ${count} of ${AVAILABLE_RESELLERS.length} resellers`;

    if (count > 0) {
      selectedCount.style.color = "#28a745";
      selectedCount.style.fontWeight = "600";
    } else {
      selectedCount.style.color = "#666";
      selectedCount.style.fontWeight = "normal";
    }
  }

  function updateStatus(message) {
    const status = document.getElementById("reseller-status");
    if (status) {
      status.textContent = message;
      setTimeout(() => {
        status.textContent = "Ready";
      }, 2000);
    }
  }

  function saveSelectedResellers() {
    const checkedBoxes = container.querySelectorAll(
      'input[type="checkbox"]:checked'
    );
    const selectedResellers = Array.from(checkedBoxes).map((cb) => cb.value);

    console.log("💾 Saving selected resellers:", selectedResellers);
    updateStatus("Saving...");

    if (selectedResellers.length === 0) {
      updateStatus("No resellers selected");
      return;
    }

    saveToMetafield(selectedResellers)
      .then(() => {
        updateStatus("✅ Saved successfully!");
        console.log("✅ Resellers saved to metafield");
      })
      .catch((error) => {
        updateStatus("❌ Save failed");
        console.error("❌ Error saving resellers:", error);
      });
  }

  // Initialize
  updateSelectedCount();
  updateStatus("Ready");

  return container;
}

async function saveToMetafield(selectedResellers) {
  const productId = getProductId();
  if (!productId) {
    throw new Error("Product ID not found");
  }

  // Join reseller names with newlines for multi-line text field
  const resellerText = selectedResellers.join("\n");

  console.log("📝 Saving to metafield:", {
    productId,
    resellerText,
    metafield: `${CONFIG.metafieldNamespace}.${CONFIG.metafieldKey}`,
  });

  try {
    const response = await fetch(`/admin/products/${productId}.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        product: {
          id: productId,
          metafields: [
            {
              namespace: CONFIG.metafieldNamespace,
              key: CONFIG.metafieldKey,
              value: resellerText,
              type: CONFIG.metafieldType,
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✅ Metafield updated successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Error updating metafield:", error);
    throw error;
  }
}

async function loadSelectedResellers() {
  const productId = getProductId();
  if (!productId) {
    console.log("⚠️ No product ID found");
    return;
  }

  try {
    console.log("📥 Loading existing reseller selections...");

    // Try to get metafield value from the page
    const metafieldInput = document.querySelector(
      `input[name="product[metafields_attributes][${CONFIG.metafieldNamespace}.${CONFIG.metafieldKey}][value]"]`
    );

    if (metafieldInput && metafieldInput.value) {
      const existingResellers = metafieldInput.value
        .split("\n")
        .filter((name) => name.trim());
      console.log("📋 Found existing resellers:", existingResellers);

      // Check the corresponding checkboxes
      const checkboxes = document.querySelectorAll(
        '#reseller-checkboxes input[type="checkbox"]'
      );
      checkboxes.forEach((checkbox) => {
        checkbox.checked = existingResellers.includes(checkbox.value);
      });

      // Update the count display
      const selectedCount = document.getElementById("selected-count");
      if (selectedCount) {
        const checkedCount = document.querySelectorAll(
          '#reseller-checkboxes input[type="checkbox"]:checked'
        ).length;
        selectedCount.textContent = `Selected: ${checkedCount} of ${AVAILABLE_RESELLERS.length} resellers`;
        if (checkedCount > 0) {
          selectedCount.style.color = "#28a745";
          selectedCount.style.fontWeight = "600";
        }
      }
    } else {
      console.log("📋 No existing reseller selections found");
    }
  } catch (error) {
    console.error("❌ Error loading reseller selections:", error);
  }
}

function insertResellerUI() {
  console.log("🔍 Looking for insertion point...");

  // Try multiple insertion points
  const insertionPoints = [
    ".product-form__buttons",
    ".product-form__actions",
    ".form-actions",
    ".btn-group",
    ".product-edit-form",
    ".product-form",
    ".form-horizontal",
    ".card",
    ".panel",
  ];

  let inserted = false;

  for (const selector of insertionPoints) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`✅ Found insertion point: ${selector}`);
      const resellerUI = createResellerMultiSelectUI();

      // Insert before the element
      element.parentNode.insertBefore(resellerUI, element);
      inserted = true;

      // Load existing selections
      setTimeout(loadSelectedResellers, 500);
      break;
    }
  }

  if (!inserted) {
    console.log("⚠️ No suitable insertion point found, trying fallback...");

    // Fallback: insert at the top of the main content
    const mainContent =
      document.querySelector(".main-content") ||
      document.querySelector("main") ||
      document.body;
    if (mainContent) {
      const resellerUI = createResellerMultiSelectUI();
      mainContent.insertBefore(resellerUI, mainContent.firstChild);
      setTimeout(loadSelectedResellers, 500);
      inserted = true;
    }
  }

  if (!inserted) {
    console.error("❌ Could not find suitable insertion point for reseller UI");
  }
}

function init() {
  console.log("🚀 Initializing Shopify Multi-Select Reseller Script...");

  if (!isProductEditPage()) {
    console.log("⚠️ Not on a product edit page, skipping initialization");
    return;
  }

  console.log("✅ On product edit page, proceeding with initialization");

  // Wait for page to be fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", insertResellerUI);
  } else {
    // Page already loaded, insert immediately
    setTimeout(insertResellerUI, 1000);
  }
}

// Manual trigger function for testing
window.triggerResellerMultiSelect = function () {
  console.log("🔧 Manual trigger activated");
  insertResellerUI();
};

// Auto-initialize
init();

console.log("✅ Shopify Multi-Select Reseller Script loaded successfully!");
