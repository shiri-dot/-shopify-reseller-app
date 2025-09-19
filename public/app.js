// Global variables
let resellers = [];
let selectedReseller = null;
let map = null;
let markers = [];
let editingResellerId = null;

// DOM elements
const views = {
  resellers: document.getElementById("resellersView"),
  form: document.getElementById("resellerFormView"),
  import: document.getElementById("importView"),
};

const navButtons = {
  viewResellers: document.getElementById("viewResellers"),
  addReseller: document.getElementById("addReseller"),
  importResellers: document.getElementById("importResellers"),
};

const form = document.getElementById("resellerForm");
const resellersList = document.getElementById("resellersList");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const importForm = document.getElementById("importForm");
const loadingOverlay = document.getElementById("loadingOverlay");
const modal = document.getElementById("modal");

// Initialize the app
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
  setupEventListeners();
  loadResellers();
  initializeMap();
});

function initializeApp() {
  // Set initial view
  showView("resellers");
}

function setupEventListeners() {
  // Navigation buttons
  if (navButtons.viewResellers) {
    navButtons.viewResellers.addEventListener("click", () =>
      showView("resellers")
    );
  }
  if (navButtons.addReseller) {
    navButtons.addReseller.addEventListener("click", () =>
      showAddResellerForm()
    );
  }
  if (navButtons.importResellers) {
    navButtons.importResellers.addEventListener("click", () =>
      showView("import")
    );
  }

  // Form submission
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }
  if (importForm) {
    importForm.addEventListener("submit", handleImportSubmit);
  }

  // Search functionality
  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    });
  }

  // Cancel buttons
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => showView("resellers"));
  }
  const cancelImportBtn = document.getElementById("cancelImportBtn");
  if (cancelImportBtn) {
    cancelImportBtn.addEventListener("click", () => showView("resellers"));
  }

  // Modal buttons
  const modalCancel = document.getElementById("modalCancel");
  const modalConfirm = document.getElementById("modalConfirm");
  if (modalCancel) modalCancel.addEventListener("click", hideModal);
  if (modalConfirm) modalConfirm.addEventListener("click", confirmModalAction);
}

function showView(viewName) {
  // Hide all views
  Object.values(views).forEach(
    (view) => view && view.classList.remove("active")
  );

  // Remove active class from all nav buttons
  Object.values(navButtons).forEach(
    (btn) => btn && btn.classList.remove("active")
  );

  // Show selected view
  if (views[viewName]) views[viewName].classList.add("active");

  // Add active class to corresponding nav button
  if (viewName === "resellers" && navButtons.viewResellers) {
    navButtons.viewResellers.classList.add("active");
  } else if (viewName === "form" && navButtons.addReseller) {
    navButtons.addReseller.classList.add("active");
  } else if (viewName === "import" && navButtons.importResellers) {
    navButtons.importResellers.classList.add("active");
  }
}

function showAddResellerForm() {
  editingResellerId = null;
  const formTitle = document.getElementById("formTitle");
  if (formTitle) formTitle.textContent = "Add New Reseller";
  if (form) form.reset();
  showView("form");
}

function showEditResellerForm(reseller) {
  editingResellerId = reseller.id;
  const formTitle = document.getElementById("formTitle");
  if (formTitle) formTitle.textContent = "Edit Reseller";

  // Populate form with reseller data
  const nameEl = document.getElementById("resellerName");
  const logoEl = document.getElementById("resellerLogo");
  const descEl = document.getElementById("resellerDescription");
  const websiteEl = document.getElementById("resellerWebsite");
  const locationEl = document.getElementById("resellerLocation");
  const latEl = document.getElementById("resellerLatitude");
  const lngEl = document.getElementById("resellerLongitude");

  if (nameEl) nameEl.value = reseller.name || "";
  if (logoEl) logoEl.value = reseller.logo_url || "";
  if (descEl) descEl.value = reseller.description || "";
  if (websiteEl) websiteEl.value = reseller.website_url || "";
  if (locationEl) locationEl.value = reseller.location_url || "";
  if (latEl) latEl.value = reseller.latitude || "";
  if (lngEl) lngEl.value = reseller.longitude || "";

  showView("form");
}

// API Functions
async function loadResellers() {
  showLoading();
  try {
    const response = await fetch("/api/resellers");
    if (!response.ok) throw new Error("Failed to load resellers");

    resellers = await response.json();
    renderResellersList();
    updateMap();
  } catch (error) {
    showError("Failed to load resellers: " + error.message);
  } finally {
    hideLoading();
  }
}

async function saveReseller(resellerData) {
  const url = editingResellerId
    ? `/api/resellers/${editingResellerId}`
    : "/api/resellers";
  const method = editingResellerId ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resellerData),
    });

    if (!response.ok) throw new Error("Failed to save reseller");

    await response.json();
    showSuccess(
      editingResellerId
        ? "Reseller updated successfully"
        : "Reseller created successfully"
    );

    // Reload resellers and return to list view
    await loadResellers();
    showView("resellers");

    return true;
  } catch (error) {
    showError("Failed to save reseller: " + error.message);
    throw error;
  }
}

async function deleteReseller(resellerId) {
  try {
    const response = await fetch(`/api/resellers/${resellerId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete reseller");

    showSuccess("Reseller deleted successfully");
    await loadResellers();
  } catch (error) {
    showError("Failed to delete reseller: " + error.message);
  }
}

async function searchResellers(query) {
  if (!query.trim()) {
    await loadResellers();
    return;
  }

  showLoading();
  try {
    const response = await fetch(
      `/api/resellers/search/${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error("Failed to search resellers");

    resellers = await response.json();
    renderResellersList();
    updateMap();
  } catch (error) {
    showError("Failed to search resellers: " + error.message);
  } finally {
    hideLoading();
  }
}

async function importResellers(csvFile) {
  const formData = new FormData();
  formData.append("csv", csvFile);

  showLoading();
  try {
    const response = await fetch("/api/resellers/import", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to import resellers");

    const result = await response.json();
    showImportResults(result);

    // Reload resellers if import was successful
    if (result.imported > 0) {
      await loadResellers();
    }
  } catch (error) {
    showError("Failed to import resellers: " + error.message);
  } finally {
    hideLoading();
  }
}

// Event Handlers
function handleFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(form);
  const resellerData = {
    name: formData.get("name"),
    logo_url: formData.get("logo_url"),
    description: formData.get("description"),
    website_url: formData.get("website_url"),
    location_url: formData.get("location_url"),
    latitude: parseFloat(formData.get("latitude")) || null,
    longitude: parseFloat(formData.get("longitude")) || null,
  };

  saveReseller(resellerData);
}

function handleImportSubmit(e) {
  e.preventDefault();

  const csvFile = document.getElementById("csvFile").files[0];
  if (!csvFile) {
    showError("Please select a CSV file");
    return;
  }

  importResellers(csvFile);
}

function handleSearch() {
  const query = (searchInput && searchInput.value.trim()) || "";
  searchResellers(query);
}

// Rendering Functions
function renderResellersList() {
  if (!resellersList) return;

  if (resellers.length === 0) {
    resellersList.innerHTML =
      '<div class="text-center text-muted">No resellers found</div>';
    return;
  }

  resellersList.innerHTML = resellers
    .map(
      (reseller) => `
        <div class="reseller-item ${
          selectedReseller?.id === reseller.id ? "selected" : ""
        }" 
             onclick="selectReseller(${reseller.id})">
            <div class="reseller-header">
                ${
                  reseller.logo_url
                    ? `<img src="${reseller.logo_url}" alt="${reseller.name}" class="reseller-logo" onerror="this.style.display='none'">`
                    : '<div class="reseller-logo" style="background: #e9ecef; display: flex; align-items: center; justify-content: center; color: #6c757d; font-size: 0.8rem;">No Logo</div>'
                }
                <div class="reseller-name">${reseller.name}</div>
            </div>
            ${
              reseller.description
                ? `<div class="reseller-description">${reseller.description}</div>`
                : ""
            }
            <div class="reseller-actions">
                ${
                  reseller.website_url
                    ? `<a href="${reseller.website_url}" target="_blank" class="btn btn-primary btn-sm">Website</a>`
                    : ""
                }
                ${
                  reseller.location_url
                    ? `<a href="${reseller.location_url}" target="_blank" class="btn btn-secondary btn-sm">Location</a>`
                    : ""
                }
                <button onclick="event.stopPropagation(); showEditResellerForm(${JSON.stringify(
                  reseller
                ).replace(
                  /"/g,
                  "&quot;"
                )})" class="btn btn-secondary btn-sm">Edit</button>
                <button onclick="event.stopPropagation(); confirmDeleteReseller(${
                  reseller.id
                }, '${
        reseller.name
      }')" class="btn btn-danger btn-sm">Delete</button>
            </div>
        </div>
    `
    )
    .join("");
}

function selectReseller(resellerId) {
  selectedReseller = resellers.find((r) => r.id === resellerId);
  renderResellersList();
  updateMap();
}

function confirmDeleteReseller(resellerId, resellerName) {
  showModal(
    "Delete Reseller",
    `Are you sure you want to delete "${resellerName}"? This action cannot be undone.`,
    () => deleteReseller(resellerId)
  );
}

// Map Functions
function initializeMap() {
  if (typeof google === "undefined") {
    return;
  }

  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  map = new google.maps.Map(mapElement, {
    zoom: 2,
    center: { lat: 0, lng: 0 },
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  });
}

function updateMap() {
  if (!map) return;

  // Clear existing markers
  markers.forEach((marker) => marker.setMap(null));
  markers = [];

  if (resellers.length === 0) return;

  const bounds = new google.maps.LatLngBounds();
  let hasValidLocation = false;

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
                    <div style="padding: 10px;">
                        <h4>${reseller.name}</h4>
                        ${
                          reseller.description
                            ? `<p>${reseller.description}</p>`
                            : ""
                        }
                        ${
                          reseller.website_url
                            ? `<a href="${reseller.website_url}" target="_blank">Visit Website</a>`
                            : ""
                        }
                    </div>
                `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
        selectReseller(reseller.id);
      });

      markers.push(marker);
      bounds.extend(position);
      hasValidLocation = true;
    }
  });

  if (hasValidLocation) {
    map.fitBounds(bounds);
  }
}

// Import Results
function showImportResults(result) {
  const resultsDiv = document.getElementById("importResults");
  if (!resultsDiv) return;
  const isError = result.errors > 0;

  resultsDiv.className = `import-results ${isError ? "error" : ""}`;
  resultsDiv.style.display = "block";

  resultsDiv.innerHTML = `
        <h4>Import Results</h4>
        <p><strong>Imported:</strong> ${result.imported} resellers</p>
        <p><strong>Errors:</strong> ${result.errors}</p>
        ${
          result.errors > 0
            ? `
            <details>
                <summary>View Errors</summary>
                <ul>
                    ${result.errors
                      .map((error) => `<li>${error.error}</li>`)
                      .join("")}
                </ul>
            </details>
        `
            : ""
        }
    `;
}

// Modal Functions
function showModal(title, message, onConfirm) {
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  if (modalTitle) modalTitle.textContent = title;
  if (modalMessage) modalMessage.textContent = message;
  if (modal) modal.style.display = "flex";

  // Store the confirm action
  if (modal) modal.dataset.confirmAction = onConfirm.toString();
}

function hideModal() {
  if (modal) modal.style.display = "none";
}

function confirmModalAction() {
  if (!modal) return;
  const action = modal.dataset.confirmAction;
  if (action) {
    // eslint-disable-next-line no-eval
    eval("(" + action + ")()");
  }
  hideModal();
}

// Utility Functions
function showLoading() {
  if (loadingOverlay) loadingOverlay.style.display = "flex";
}

function hideLoading() {
  if (loadingOverlay) loadingOverlay.style.display = "none";
}

function showSuccess(message) {
  alert("Success: " + message);
}

function showError(message) {
  alert("Error: " + message);
}

// Make functions globally available for onclick handlers
window.selectReseller = selectReseller;
window.showEditResellerForm = showEditResellerForm;
window.confirmDeleteReseller = confirmDeleteReseller;
