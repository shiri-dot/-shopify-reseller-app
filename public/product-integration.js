// Product Integration JavaScript for Shopify Product Pages

// Global variables
let productResellers = [];
let allResellers = [];
let currentProductId = null;

// Initialize product integration
document.addEventListener("DOMContentLoaded", function () {
  initializeProductIntegration();
});

function initializeProductIntegration() {
  // Get current product ID from Shopify context
  if (typeof window.Shopify !== "undefined" && window.Shopify.routes) {
    const pathParts = window.location.pathname.split("/");
    const productIndex = pathParts.indexOf("products");
    if (productIndex !== -1 && pathParts[productIndex + 1]) {
      currentProductId = pathParts[productIndex + 1];
    }
  }

  // If we can't get it from Shopify context, try to extract from URL
  if (!currentProductId) {
    const match = window.location.pathname.match(/\/products\/([^\/]+)/);
    if (match) {
      currentProductId = match[1];
    }
  }

  if (currentProductId) {
    loadProductResellers();
    loadAllResellers();
    createResellerSection();
  }
}

// API Functions
async function loadProductResellers() {
  try {
    const response = await fetch(`/api/products/${currentProductId}/resellers`);
    if (!response.ok) throw new Error("Failed to load product resellers");

    productResellers = await response.json();
  } catch (error) {
    console.error("Error loading product resellers:", error);
    productResellers = [];
  }
}

async function loadAllResellers() {
  try {
    const response = await fetch("/api/resellers");
    if (!response.ok) throw new Error("Failed to load resellers");

    allResellers = await response.json();
  } catch (error) {
    console.error("Error loading resellers:", error);
    allResellers = [];
  }
}

async function saveProductResellers(resellerIds) {
  try {
    const response = await fetch(
      `/api/products/${currentProductId}/resellers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resellerIds }),
      }
    );

    if (!response.ok) throw new Error("Failed to save product resellers");

    const result = await response.json();
    showSuccess("Resellers updated successfully");
    return result;
  } catch (error) {
    showError("Failed to save resellers: " + error.message);
    throw error;
  }
}

// UI Creation Functions
function createResellerSection() {
  // Check if reseller section already exists
  if (document.getElementById("reseller-section")) {
    return;
  }

  // Find a good place to insert the reseller section
  const productForm =
    document.querySelector(".product-form") ||
    document.querySelector(".product-single__form") ||
    document.querySelector(".product-form-container") ||
    document.querySelector('form[action*="/cart/add"]');

  if (!productForm) {
    console.warn("Could not find product form to attach reseller section");
    return;
  }

  // Create reseller section
  const resellerSection = document.createElement("div");
  resellerSection.id = "reseller-section";
  resellerSection.className = "reseller-section";
  resellerSection.innerHTML = createResellerSectionHTML();

  // Insert before the product form
  productForm.parentNode.insertBefore(resellerSection, productForm);

  // Set up event listeners
  setupResellerSectionEventListeners();

  // Populate the section
  populateResellerSection();
}

function createResellerSectionHTML() {
  return `
        <div class="reseller-section-container">
            <h3 class="reseller-section-title">Find Resellers</h3>
            <p class="reseller-section-description">This product is available through our authorized resellers.</p>
            
            <div class="reseller-controls">
                <div class="reseller-dropdown-container">
                    <label for="reseller-select">Select Resellers:</label>
                    <select id="reseller-select" multiple class="reseller-select">
                        <!-- Options will be populated dynamically -->
                    </select>
                    <div class="reseller-actions">
                        <button type="button" id="select-all-resellers" class="btn btn-secondary btn-sm">Select All</button>
                        <button type="button" id="clear-resellers" class="btn btn-secondary btn-sm">Clear All</button>
                    </div>
                </div>
            </div>
            
            <div id="selected-resellers" class="selected-resellers">
                <!-- Selected resellers will be displayed here -->
            </div>
            
            <div id="reseller-map-container" class="reseller-map-container" style="display: none;">
                <h4>Reseller Locations</h4>
                <div id="reseller-map" class="reseller-map"></div>
            </div>
        </div>
    `;
}

function setupResellerSectionEventListeners() {
  const resellerSelect = document.getElementById("reseller-select");
  const selectAllBtn = document.getElementById("select-all-resellers");
  const clearBtn = document.getElementById("clear-resellers");

  if (resellerSelect) {
    resellerSelect.addEventListener("change", handleResellerSelection);
  }

  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", selectAllResellers);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", clearAllResellers);
  }
}

function populateResellerSection() {
  const resellerSelect = document.getElementById("reseller-select");
  if (!resellerSelect) return;

  // Clear existing options
  resellerSelect.innerHTML = "";

  // Add reseller options
  allResellers.forEach((reseller) => {
    const option = document.createElement("option");
    option.value = reseller.id;
    option.textContent = reseller.name;
    option.selected = productResellers.some((pr) => pr.id === reseller.id);
    resellerSelect.appendChild(option);
  });

  // Update display
  updateSelectedResellersDisplay();
}

function handleResellerSelection() {
  const resellerSelect = document.getElementById("reseller-select");
  const selectedOptions = Array.from(resellerSelect.selectedOptions);
  const selectedResellerIds = selectedOptions.map((option) =>
    parseInt(option.value)
  );

  // Update product resellers
  saveProductResellers(selectedResellerIds);

  // Update display
  updateSelectedResellersDisplay();
}

function selectAllResellers() {
  const resellerSelect = document.getElementById("reseller-select");
  if (!resellerSelect) return;

  Array.from(resellerSelect.options).forEach((option) => {
    option.selected = true;
  });

  handleResellerSelection();
}

function clearAllResellers() {
  const resellerSelect = document.getElementById("reseller-select");
  if (!resellerSelect) return;

  Array.from(resellerSelect.options).forEach((option) => {
    option.selected = false;
  });

  handleResellerSelection();
}

function updateSelectedResellersDisplay() {
  const resellerSelect = document.getElementById("reseller-select");
  const selectedResellersDiv = document.getElementById("selected-resellers");
  const mapContainer = document.getElementById("reseller-map-container");

  if (!resellerSelect || !selectedResellersDiv) return;

  const selectedOptions = Array.from(resellerSelect.selectedOptions);
  const selectedResellers = selectedOptions
    .map((option) => {
      const resellerId = parseInt(option.value);
      return allResellers.find((r) => r.id === resellerId);
    })
    .filter(Boolean);

  if (selectedResellers.length === 0) {
    selectedResellersDiv.innerHTML =
      '<p class="no-resellers">No resellers selected</p>';
    mapContainer.style.display = "none";
    return;
  }

  // Display selected resellers
  selectedResellersDiv.innerHTML = `
        <h4>Selected Resellers (${selectedResellers.length})</h4>
        <div class="reseller-cards">
            ${selectedResellers
              .map(
                (reseller) => `
                <div class="reseller-card">
                    <div class="reseller-card-header">
                        ${
                          reseller.logo_url
                            ? `<img src="${reseller.logo_url}" alt="${reseller.name}" class="reseller-card-logo" onerror="this.style.display='none'">`
                            : '<div class="reseller-card-logo-placeholder">No Logo</div>'
                        }
                        <div class="reseller-card-info">
                            <h5 class="reseller-card-name">${reseller.name}</h5>
                            ${
                              reseller.description
                                ? `<p class="reseller-card-description">${reseller.description}</p>`
                                : ""
                            }
                        </div>
                    </div>
                    <div class="reseller-card-actions">
                        ${
                          reseller.website_url
                            ? `<a href="${reseller.website_url}" target="_blank" class="btn btn-primary btn-sm">Visit Website</a>`
                            : ""
                        }
                        ${
                          reseller.location_url
                            ? `<a href="${reseller.location_url}" target="_blank" class="btn btn-secondary btn-sm">View Location</a>`
                            : ""
                        }
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
    `;

  // Show map if there are resellers with coordinates
  const resellersWithCoords = selectedResellers.filter(
    (r) => r.latitude && r.longitude
  );
  if (resellersWithCoords.length > 0) {
    mapContainer.style.display = "block";
    initializeResellerMap(resellersWithCoords);
  } else {
    mapContainer.style.display = "none";
  }
}

function initializeResellerMap(resellers) {
  const mapElement = document.getElementById("reseller-map");
  if (!mapElement || typeof google === "undefined") return;

  // Clear existing map
  mapElement.innerHTML = "";

  const map = new google.maps.Map(mapElement, {
    zoom: 2,
    center: { lat: 0, lng: 0 },
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  });

  const bounds = new google.maps.LatLngBounds();
  const markers = [];

  resellers.forEach((reseller) => {
    if (reseller.latitude && reseller.longitude) {
      const position = { lat: reseller.latitude, lng: reseller.longitude };

      const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: reseller.name,
        icon: {
          url:
            reseller.logo_url ||
            "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
          scaledSize: new google.maps.Size(30, 30),
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
                    <div style="padding: 10px; max-width: 200px;">
                        <h4 style="margin: 0 0 8px 0;">${reseller.name}</h4>
                        ${
                          reseller.description
                            ? `<p style="margin: 0 0 8px 0; font-size: 14px;">${reseller.description}</p>`
                            : ""
                        }
                        ${
                          reseller.website_url
                            ? `<a href="${reseller.website_url}" target="_blank" style="color: #007bff; text-decoration: none;">Visit Website</a>`
                            : ""
                        }
                    </div>
                `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      markers.push(marker);
      bounds.extend(position);
    }
  });

  if (markers.length > 0) {
    map.fitBounds(bounds);
  }
}

// Utility Functions
function showSuccess(message) {
  // Simple success notification
  const notification = document.createElement("div");
  notification.className =
    "reseller-notification reseller-notification-success";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function showError(message) {
  // Simple error notification
  const notification = document.createElement("div");
  notification.className = "reseller-notification reseller-notification-error";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Add CSS styles for the reseller section
const resellerStyles = `
    <style>
        .reseller-section {
            margin: 2rem 0;
            padding: 1.5rem;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .reseller-section-title {
            margin: 0 0 0.5rem 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .reseller-section-description {
            margin: 0 0 1.5rem 0;
            color: #6c757d;
        }
        
        .reseller-dropdown-container {
            margin-bottom: 1rem;
        }
        
        .reseller-dropdown-container label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #495057;
        }
        
        .reseller-select {
            width: 100%;
            min-height: 120px;
            padding: 0.5rem;
            border: 1px solid #ced4da;
            border-radius: 4px;
            background: #fff;
            font-size: 0.875rem;
        }
        
        .reseller-actions {
            margin-top: 0.5rem;
            display: flex;
            gap: 0.5rem;
        }
        
        .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
            text-decoration: none;
            display: inline-block;
            transition: all 0.2s ease;
        }
        
        .btn-primary {
            background: #007bff;
            color: #fff;
        }
        
        .btn-primary:hover {
            background: #0056b3;
        }
        
        .btn-secondary {
            background: #6c757d;
            color: #fff;
        }
        
        .btn-secondary:hover {
            background: #545b62;
        }
        
        .btn-sm {
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
        }
        
        .selected-resellers {
            margin-top: 1.5rem;
        }
        
        .selected-resellers h4 {
            margin: 0 0 1rem 0;
            font-size: 1.1rem;
            color: #2c3e50;
        }
        
        .reseller-cards {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
        }
        
        .reseller-card {
            background: #fff;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 1rem;
        }
        
        .reseller-card-header {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
        }
        
        .reseller-card-logo {
            width: 50px;
            height: 50px;
            border-radius: 4px;
            object-fit: cover;
        }
        
        .reseller-card-logo-placeholder {
            width: 50px;
            height: 50px;
            border-radius: 4px;
            background: #e9ecef;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6c757d;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .reseller-card-info {
            flex: 1;
        }
        
        .reseller-card-name {
            margin: 0 0 0.25rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .reseller-card-description {
            margin: 0;
            font-size: 0.875rem;
            color: #6c757d;
        }
        
        .reseller-card-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .reseller-map-container {
            margin-top: 1.5rem;
        }
        
        .reseller-map-container h4 {
            margin: 0 0 1rem 0;
            font-size: 1.1rem;
            color: #2c3e50;
        }
        
        .reseller-map {
            width: 100%;
            height: 300px;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        }
        
        .no-resellers {
            color: #6c757d;
            font-style: italic;
        }
        
        .reseller-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            color: #fff;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        }
        
        .reseller-notification-success {
            background: #28a745;
        }
        
        .reseller-notification-error {
            background: #dc3545;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @media (max-width: 768px) {
            .reseller-cards {
                grid-template-columns: 1fr;
            }
            
            .reseller-card-header {
                flex-direction: column;
                text-align: center;
            }
            
            .reseller-card-actions {
                justify-content: center;
            }
        }
    </style>
`;

// Inject styles
document.head.insertAdjacentHTML("beforeend", resellerStyles);
