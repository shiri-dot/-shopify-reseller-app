// Reseller App JavaScript for Shopify Theme Integration

class ResellerApp {
  constructor() {
    this.productHandle = null;
    this.apiBaseUrl = null;
    this.googleMapsApiKey = null;
    this.resellers = [];
    this.productResellers = [];
    this.map = null;
    this.markers = [];
  }

  init(options) {
    this.productHandle = options.productHandle;
    this.apiBaseUrl = options.apiBaseUrl;
    this.googleMapsApiKey = options.googleMapsApiKey;

    this.setupEventListeners();
    this.loadResellerData();
  }

  setupEventListeners() {
    // Reseller selection
    const resellerSelect = document.getElementById("reseller-select");
    if (resellerSelect) {
      resellerSelect.addEventListener("change", () =>
        this.handleResellerSelection()
      );
    }

    // Action buttons
    const selectAllBtn = document.getElementById("select-all-resellers");
    const clearBtn = document.getElementById("clear-resellers");

    if (selectAllBtn) {
      selectAllBtn.addEventListener("click", () => this.selectAllResellers());
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearAllResellers());
    }
  }

  async loadResellerData() {
    try {
      this.showLoading();

      // Load all resellers
      await this.loadAllResellers();

      // Load product-specific resellers
      await this.loadProductResellers();

      // Populate the UI
      this.populateResellerSelect();
      this.updateSelectedResellersDisplay();

      this.hideLoading();
      this.showContent();
    } catch (error) {
      console.error("Error loading reseller data:", error);
      this.showError();
    }
  }

  async loadAllResellers() {
    const response = await fetch(`${this.apiBaseUrl}/api/resellers`);
    if (!response.ok) {
      throw new Error("Failed to load resellers");
    }
    this.resellers = await response.json();
  }

  async loadProductResellers() {
    const response = await fetch(
      `${this.apiBaseUrl}/api/products/${this.productHandle}/resellers`
    );
    if (!response.ok) {
      throw new Error("Failed to load product resellers");
    }
    this.productResellers = await response.json();
  }

  async saveProductResellers(resellerIds) {
    const response = await fetch(
      `${this.apiBaseUrl}/api/products/${this.productHandle}/resellers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resellerIds }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to save product resellers");
    }

    return await response.json();
  }

  populateResellerSelect() {
    const resellerSelect = document.getElementById("reseller-select");
    if (!resellerSelect) return;

    // Clear existing options
    resellerSelect.innerHTML = "";

    // Add reseller options
    this.resellers.forEach((reseller) => {
      const option = document.createElement("option");
      option.value = reseller.id;
      option.textContent = reseller.name;
      option.selected = this.productResellers.some(
        (pr) => pr.id === reseller.id
      );
      resellerSelect.appendChild(option);
    });
  }

  handleResellerSelection() {
    const resellerSelect = document.getElementById("reseller-select");
    if (!resellerSelect) return;

    const selectedOptions = Array.from(resellerSelect.selectedOptions);
    const selectedResellerIds = selectedOptions.map((option) =>
      parseInt(option.value)
    );

    // Update product resellers
    this.saveProductResellers(selectedResellerIds)
      .then(() => {
        this.updateSelectedResellersDisplay();
      })
      .catch((error) => {
        console.error("Error saving resellers:", error);
        this.showNotification("Failed to save reseller selection", "error");
      });
  }

  selectAllResellers() {
    const resellerSelect = document.getElementById("reseller-select");
    if (!resellerSelect) return;

    Array.from(resellerSelect.options).forEach((option) => {
      option.selected = true;
    });

    this.handleResellerSelection();
  }

  clearAllResellers() {
    const resellerSelect = document.getElementById("reseller-select");
    if (!resellerSelect) return;

    Array.from(resellerSelect.options).forEach((option) => {
      option.selected = false;
    });

    this.handleResellerSelection();
  }

  updateSelectedResellersDisplay() {
    const resellerSelect = document.getElementById("reseller-select");
    const selectedResellersDiv = document.getElementById("selected-resellers");
    const mapContainer = document.getElementById("reseller-map-container");

    if (!resellerSelect || !selectedResellersDiv) return;

    const selectedOptions = Array.from(resellerSelect.selectedOptions);
    const selectedResellers = selectedOptions
      .map((option) => {
        const resellerId = parseInt(option.value);
        return this.resellers.find((r) => r.id === resellerId);
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
                  .map((reseller) => this.createResellerCard(reseller))
                  .join("")}
            </div>
        `;

    // Show map if there are resellers with coordinates
    const resellersWithCoords = selectedResellers.filter(
      (r) => r.latitude && r.longitude
    );
    if (resellersWithCoords.length > 0) {
      mapContainer.style.display = "block";
      this.initializeResellerMap(resellersWithCoords);
    } else {
      mapContainer.style.display = "none";
    }
  }

  createResellerCard(reseller) {
    return `
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
        `;
  }

  initializeResellerMap(resellers) {
    const mapElement = document.getElementById("reseller-map");
    if (!mapElement || typeof google === "undefined") return;

    // Clear existing map
    mapElement.innerHTML = "";

    this.map = new google.maps.Map(mapElement, {
      zoom: 2,
      center: { lat: 0, lng: 0 },
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    });

    const bounds = new google.maps.LatLngBounds();
    this.markers = [];

    resellers.forEach((reseller) => {
      if (reseller.latitude && reseller.longitude) {
        const position = { lat: reseller.latitude, lng: reseller.longitude };

        const marker = new google.maps.Marker({
          position: position,
          map: this.map,
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
          infoWindow.open(this.map, marker);
        });

        this.markers.push(marker);
        bounds.extend(position);
      }
    });

    if (this.markers.length > 0) {
      this.map.fitBounds(bounds);
    }
  }

  // UI State Management
  showLoading() {
    const loading = document.getElementById("reseller-loading");
    const content = document.getElementById("reseller-content");
    const error = document.getElementById("reseller-error");

    if (loading) loading.style.display = "block";
    if (content) content.style.display = "none";
    if (error) error.style.display = "none";
  }

  hideLoading() {
    const loading = document.getElementById("reseller-loading");
    if (loading) loading.style.display = "none";
  }

  showContent() {
    const content = document.getElementById("reseller-content");
    if (content) content.style.display = "block";
  }

  showError() {
    const loading = document.getElementById("reseller-loading");
    const content = document.getElementById("reseller-content");
    const error = document.getElementById("reseller-error");

    if (loading) loading.style.display = "none";
    if (content) content.style.display = "none";
    if (error) error.style.display = "block";
  }

  showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `reseller-notification reseller-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(
      () => {
        notification.remove();
      },
      type === "error" ? 5000 : 3000
    );
  }
}

// Make ResellerApp globally available
window.ResellerApp = ResellerApp;
