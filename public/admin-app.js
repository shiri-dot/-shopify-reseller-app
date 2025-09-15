// Admin App JavaScript for Shopify Admin interface

// Global variables
let resellers = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalItems = 0;
let searchQuery = "";
let editingResellerId = null;

// DOM elements
const resellersTableBody = document.getElementById("resellersTableBody");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const addResellerBtn = document.getElementById("addResellerBtn");
const importBtn = document.getElementById("importBtn");
const resellerModal = document.getElementById("resellerModal");
const importModal = document.getElementById("importModal");
const confirmModal = document.getElementById("confirmModal");
const loadingOverlay = document.getElementById("loadingOverlay");
const resellerForm = document.getElementById("resellerForm");
const importForm = document.getElementById("importForm");

// Pagination elements
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");
const paginationInfo = document.getElementById("paginationInfo");

// Initialize the admin app
document.addEventListener("DOMContentLoaded", function () {
  initializeAdminApp();
  setupEventListeners();
  loadResellers();
});

function initializeAdminApp() {
  // Initialize Shopify App Bridge if available
  if (typeof window.shopify !== "undefined") {
    // Shopify App Bridge is available
    console.log("Shopify App Bridge initialized");
  }
}

function setupEventListeners() {
  // Search functionality
  searchBtn.addEventListener("click", handleSearch);
  clearSearchBtn.addEventListener("click", clearSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });

  // Modal buttons
  addResellerBtn.addEventListener("click", showAddResellerModal);
  importBtn.addEventListener("click", showImportModal);

  // Close modal buttons
  document
    .getElementById("closeModalBtn")
    .addEventListener("click", hideResellerModal);
  document
    .getElementById("closeImportModalBtn")
    .addEventListener("click", hideImportModal);
  document
    .getElementById("closeConfirmModalBtn")
    .addEventListener("click", hideConfirmModal);

  // Form submissions
  resellerForm.addEventListener("submit", handleResellerFormSubmit);
  importForm.addEventListener("submit", handleImportFormSubmit);

  // Cancel buttons
  document
    .getElementById("cancelBtn")
    .addEventListener("click", hideResellerModal);
  document
    .getElementById("cancelImportBtn")
    .addEventListener("click", hideImportModal);
  document
    .getElementById("confirmCancelBtn")
    .addEventListener("click", hideConfirmModal);

  // Pagination
  prevPageBtn.addEventListener("click", () => changePage(currentPage - 1));
  nextPageBtn.addEventListener("click", () => changePage(currentPage + 1));

  // Logo preview
  document
    .getElementById("resellerLogo")
    .addEventListener("input", handleLogoPreview);

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === resellerModal) hideResellerModal();
    if (e.target === importModal) hideImportModal();
    if (e.target === confirmModal) hideConfirmModal();
  });
}

// API Functions
async function loadResellers() {
  showLoading();
  try {
    const url = searchQuery
      ? `/api/resellers/search/${encodeURIComponent(searchQuery)}`
      : "/api/resellers";

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to load resellers");

    resellers = await response.json();
    totalItems = resellers.length;
    renderResellersTable();
    updatePagination();
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

    const result = await response.json();
    showSuccess(
      editingResellerId
        ? "Reseller updated successfully"
        : "Reseller created successfully"
    );

    hideResellerModal();
    await loadResellers();

    return result;
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
function handleSearch() {
  searchQuery = searchInput.value.trim();
  currentPage = 1;
  loadResellers();
}

function clearSearch() {
  searchInput.value = "";
  searchQuery = "";
  currentPage = 1;
  loadResellers();
}

function handleResellerFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(resellerForm);
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

function handleImportFormSubmit(e) {
  e.preventDefault();

  const csvFile = document.getElementById("csvFile").files[0];
  if (!csvFile) {
    showError("Please select a CSV file");
    return;
  }

  importResellers(csvFile);
}

function handleLogoPreview() {
  const logoUrl = document.getElementById("resellerLogo").value;
  const preview = document.getElementById("logoPreview");
  const previewImg = document.getElementById("logoPreviewImg");

  if (logoUrl && isValidUrl(logoUrl)) {
    previewImg.src = logoUrl;
    previewImg.onerror = () => (preview.style.display = "none");
    previewImg.onload = () => (preview.style.display = "block");
  } else {
    preview.style.display = "none";
  }
}

// Modal Functions
function showAddResellerModal() {
  editingResellerId = null;
  document.getElementById("modalTitle").textContent = "Add Reseller";
  resellerForm.reset();
  document.getElementById("logoPreview").style.display = "none";
  resellerModal.style.display = "flex";
}

function showEditResellerModal(reseller) {
  editingResellerId = reseller.id;
  document.getElementById("modalTitle").textContent = "Edit Reseller";

  // Populate form
  document.getElementById("resellerName").value = reseller.name || "";
  document.getElementById("resellerLogo").value = reseller.logo_url || "";
  document.getElementById("resellerDescription").value =
    reseller.description || "";
  document.getElementById("resellerWebsite").value = reseller.website_url || "";
  document.getElementById("resellerLocation").value =
    reseller.location_url || "";
  document.getElementById("resellerLatitude").value = reseller.latitude || "";
  document.getElementById("resellerLongitude").value = reseller.longitude || "";

  // Show logo preview if URL exists
  if (reseller.logo_url) {
    handleLogoPreview();
  }

  resellerModal.style.display = "flex";
}

function hideResellerModal() {
  resellerModal.style.display = "none";
  resellerForm.reset();
  document.getElementById("logoPreview").style.display = "none";
}

function showImportModal() {
  importModal.style.display = "flex";
  document.getElementById("importResults").style.display = "none";
}

function hideImportModal() {
  importModal.style.display = "none";
  importForm.reset();
}

function showConfirmModal(title, message, onConfirm) {
  document.getElementById("confirmMessage").textContent = message;
  confirmModal.style.display = "flex";

  // Store the confirm action
  confirmModal.dataset.confirmAction = onConfirm.toString();
}

function hideConfirmModal() {
  confirmModal.style.display = "none";
}

function confirmModalAction() {
  const action = confirmModal.dataset.confirmAction;
  if (action) {
    eval("(" + action + ")()");
  }
  hideConfirmModal();
}

// Rendering Functions
function renderResellersTable() {
  if (resellers.length === 0) {
    resellersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <h3>No resellers found</h3>
                    <p>${
                      searchQuery
                        ? "Try adjusting your search criteria"
                        : "Get started by adding your first reseller"
                    }</p>
                    ${
                      !searchQuery
                        ? '<button class="btn btn-primary" onclick="showAddResellerModal()">Add Reseller</button>'
                        : ""
                    }
                </td>
            </tr>
        `;
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageResellers = resellers.slice(startIndex, endIndex);

  resellersTableBody.innerHTML = pageResellers
    .map(
      (reseller) => `
        <tr>
            <td>
                ${
                  reseller.logo_url
                    ? `<img src="${reseller.logo_url}" alt="${reseller.name}" class="table-logo" onerror="this.parentElement.innerHTML='<div class=\\"table-logo-placeholder\\">No Logo</div>'">`
                    : '<div class="table-logo-placeholder">No Logo</div>'
                }
            </td>
            <td>
                <div class="reseller-name">${reseller.name}</div>
            </td>
            <td>
                <div class="reseller-description">${
                  reseller.description || "-"
                }</div>
            </td>
            <td>
                ${
                  reseller.website_url
                    ? `<a href="${reseller.website_url}" target="_blank" class="btn btn-primary btn-sm">Visit</a>`
                    : "-"
                }
            </td>
            <td>
                ${
                  reseller.location_url
                    ? `<a href="${reseller.location_url}" target="_blank" class="btn btn-secondary btn-sm">View</a>`
                    : "-"
                }
            </td>
            <td>
                <div class="table-actions">
                    <button onclick="showEditResellerModal(${JSON.stringify(
                      reseller
                    ).replace(
                      /"/g,
                      "&quot;"
                    )})" class="btn btn-secondary btn-sm">Edit</button>
                    <button onclick="confirmDeleteReseller(${reseller.id}, '${
        reseller.name
      }')" class="btn btn-danger btn-sm">Delete</button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");
}

function updatePagination() {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} resellers`;
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

function changePage(page) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderResellersTable();
    updatePagination();
  }
}

function showImportResults(result) {
  const resultsDiv = document.getElementById("importResults");
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

// Action Functions
function confirmDeleteReseller(resellerId, resellerName) {
  showConfirmModal(
    "Delete Reseller",
    `Are you sure you want to delete "${resellerName}"? This action cannot be undone.`,
    () => deleteReseller(resellerId)
  );
}

// Utility Functions
function showLoading() {
  loadingOverlay.style.display = "flex";
}

function hideLoading() {
  loadingOverlay.style.display = "none";
}

function showSuccess(message) {
  // Simple success notification - you can enhance this with a proper notification system
  alert("Success: " + message);
}

function showError(message) {
  // Simple error notification - you can enhance this with a proper notification system
  alert("Error: " + message);
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Make functions globally available for onclick handlers
window.showAddResellerModal = showAddResellerModal;
window.showEditResellerModal = showEditResellerModal;
window.confirmDeleteReseller = confirmDeleteReseller;
