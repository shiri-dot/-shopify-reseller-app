// Admin App JavaScript for Shopify Admin interface
let resellers = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalItems = 0;
let searchQuery = "";
let editingResellerId = null;
let pendingConfirmAction = null;

// DOM elements - will be initialized after DOM is loaded
let resellersTableBody;
let searchInput;
let searchBtn;
let clearSearchBtn;
let addResellerBtn;
let importBtn;
let resellerModal;
let importModal;
let confirmModal;
let loadingOverlay;
let resellerForm;
let importForm;

// Pagination elements
let prevPageBtn;
let nextPageBtn;
let pageInfo;
let paginationInfo;

// Initialize the admin app
document.addEventListener("DOMContentLoaded", function () {
  initializeDOMElements();
  initializeAdminApp();
  setupEventListeners();
  loadResellers();
});

function initializeDOMElements() {
  console.log("Initializing DOM elements...");

  // Initialize DOM elements
  resellersTableBody = document.getElementById("resellersTableBody");
  searchInput = document.getElementById("searchInput");
  searchBtn = document.getElementById("searchBtn");
  clearSearchBtn = document.getElementById("clearSearchBtn");
  addResellerBtn = document.getElementById("addResellerBtn");
  importBtn = document.getElementById("importBtn");
  resellerModal = document.getElementById("resellerModal");
  importModal = document.getElementById("importModal");
  confirmModal = document.getElementById("confirmModal");
  loadingOverlay = document.getElementById("loadingOverlay");
  resellerForm = document.getElementById("resellerForm");
  importForm = document.getElementById("importForm");

  // Pagination elements
  prevPageBtn = document.getElementById("prevPageBtn");
  nextPageBtn = document.getElementById("nextPageBtn");
  pageInfo = document.getElementById("pageInfo");
  paginationInfo = document.getElementById("paginationInfo");

  console.log("DOM elements initialized. addResellerBtn:", addResellerBtn);
}

function initializeAdminApp() {
  // Initialize Shopify App Bridge if available
  if (typeof window.shopify !== "undefined") {
    // Shopify App Bridge is available
    console.log("Shopify App Bridge initialized");
  }
}

function setupEventListeners() {
  // Search functionality
  if (searchBtn) searchBtn.addEventListener("click", handleSearch);
  if (clearSearchBtn) clearSearchBtn.addEventListener("click", clearSearch);
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    });
  }

  // Modal buttons
  console.log("Setting up modal button event listeners...");
  console.log("addResellerBtn element:", addResellerBtn);

  if (addResellerBtn) {
    console.log("Add Reseller button found, adding event listener");
    addResellerBtn.addEventListener("click", function (e) {
      console.log("Add Reseller button clicked!");
      e.preventDefault();
      showAddResellerModal();
    });
    addResellerBtn.setAttribute("data-listener-added", "true");
  } else {
    console.error(
      "Add Reseller button not found! Check if element with id 'addResellerBtn' exists in HTML"
    );
  }
  if (importBtn) importBtn.addEventListener("click", showImportModal);

  // Close modal buttons
  const closeModalBtn = document.getElementById("closeModalBtn");
  const closeImportModalBtn = document.getElementById("closeImportModalBtn");
  const closeConfirmModalBtn = document.getElementById("closeConfirmModalBtn");

  if (closeModalBtn) closeModalBtn.addEventListener("click", hideResellerModal);
  if (closeImportModalBtn)
    closeImportModalBtn.addEventListener("click", hideImportModal);
  if (closeConfirmModalBtn)
    closeConfirmModalBtn.addEventListener("click", hideConfirmModal);

  // Form submissions
  if (resellerForm)
    resellerForm.addEventListener("submit", handleResellerFormSubmit);
  if (importForm) importForm.addEventListener("submit", handleImportFormSubmit);

  // Cancel buttons
  const cancelBtn = document.getElementById("cancelBtn");
  const cancelImportBtn = document.getElementById("cancelImportBtn");
  const confirmCancelBtn = document.getElementById("confirmCancelBtn");
  const confirmActionBtn = document.getElementById("confirmActionBtn");

  if (cancelBtn) cancelBtn.addEventListener("click", hideResellerModal);
  if (cancelImportBtn)
    cancelImportBtn.addEventListener("click", hideImportModal);
  if (confirmCancelBtn)
    confirmCancelBtn.addEventListener("click", hideConfirmModal);
  if (confirmActionBtn)
    confirmActionBtn.addEventListener("click", confirmModalAction);

  // Pagination
  if (prevPageBtn)
    prevPageBtn.addEventListener("click", () => changePage(currentPage - 1));
  if (nextPageBtn)
    nextPageBtn.addEventListener("click", () => changePage(currentPage + 1));

  // Logo preview
  const resellerLogo = document.getElementById("resellerLogo");
  if (resellerLogo) resellerLogo.addEventListener("input", handleLogoPreview);

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (resellerModal && e.target === resellerModal) hideResellerModal();
    if (importModal && e.target === importModal) hideImportModal();
    if (confirmModal && e.target === confirmModal) hideConfirmModal();
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
      // Close the modal after successful import if no errors
      const hasErrors = (result.errors && result.errors.length > 0) || (result.errorCount && result.errorCount > 0);
      if (!hasErrors) {
        setTimeout(() => {
          hideImportModal();
        }, 2000); // Wait 2 seconds to show results, then close
      }
    }
  } catch (error) {
    showError("Failed to import resellers: " + error.message);
  } finally {
    hideLoading();
  }
}

// Event Handlers
function handleSearch() {
  if (searchInput) {
    searchQuery = searchInput.value.trim();
    currentPage = 1;
    loadResellers();
  }
}

function clearSearch() {
  if (searchInput) searchInput.value = "";
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
  console.log("showAddResellerModal called");
  editingResellerId = null;
  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.textContent = "Add Reseller";
  if (resellerForm) resellerForm.reset();
  const logoPreview = document.getElementById("logoPreview");
  if (logoPreview) logoPreview.style.display = "none";
  if (resellerModal) {
    console.log("Showing reseller modal");
    resellerModal.style.display = "flex";
  } else {
    console.error("Reseller modal not found!");
  }
}

function showEditResellerModal(reseller) {
  editingResellerId = reseller.id;
  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.textContent = "Edit Reseller";

  // Populate form
  const resellerName = document.getElementById("resellerName");
  const resellerLogo = document.getElementById("resellerLogo");
  const resellerDescription = document.getElementById("resellerDescription");
  const resellerWebsite = document.getElementById("resellerWebsite");
  const resellerLocation = document.getElementById("resellerLocation");
  const resellerLatitude = document.getElementById("resellerLatitude");
  const resellerLongitude = document.getElementById("resellerLongitude");

  if (resellerName) resellerName.value = reseller.name || "";
  if (resellerLogo) resellerLogo.value = reseller.logo_url || "";
  if (resellerDescription)
    resellerDescription.value = reseller.description || "";
  if (resellerWebsite) resellerWebsite.value = reseller.website_url || "";
  if (resellerLocation) resellerLocation.value = reseller.location_url || "";
  if (resellerLatitude) resellerLatitude.value = reseller.latitude || "";
  if (resellerLongitude) resellerLongitude.value = reseller.longitude || "";

  // Show logo preview if URL exists
  if (reseller.logo_url) {
    handleLogoPreview();
  }

  if (resellerModal) resellerModal.style.display = "flex";
}

function hideResellerModal() {
  if (resellerModal) resellerModal.style.display = "none";
  if (resellerForm) resellerForm.reset();
  const logoPreview = document.getElementById("logoPreview");
  if (logoPreview) logoPreview.style.display = "none";
}

function showImportModal() {
  if (importModal) importModal.style.display = "flex";
  const importResults = document.getElementById("importResults");
  if (importResults) importResults.style.display = "none";
}

function hideImportModal() {
  if (importModal) importModal.style.display = "none";
  if (importForm) importForm.reset();
}

function showConfirmModal(title, message, onConfirm) {
  const confirmMessage = document.getElementById("confirmMessage");
  if (confirmMessage) confirmMessage.textContent = message;
  if (confirmModal) {
    confirmModal.style.display = "flex";
    // Store the confirm action function in a global variable
    pendingConfirmAction = onConfirm;
  }
}

function hideConfirmModal() {
  if (confirmModal) confirmModal.style.display = "none";
}

function confirmModalAction() {
  if (pendingConfirmAction && typeof pendingConfirmAction === 'function') {
    pendingConfirmAction();
  }
  hideConfirmModal();
  pendingConfirmAction = null;
}

// Rendering Functions
function renderResellersTable() {
  if (!resellersTableBody) return;

  if (resellers.length === 0) {
    resellersTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 2rem;">
          <div class="empty-state">
            <h3>No resellers found</h3>
            <p>${searchQuery ? "Try adjusting your search criteria" : "Get started by adding your first reseller"}</p>
            ${!searchQuery ? '<button class="btn btn-primary" onclick="showAddResellerModal()">Add Reseller</button>' : ""}
          </div>
        </td>
      </tr>`;
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
                ? `<img src="${reseller.logo_url}" alt="${reseller.name}" class="table-logo" onerror="this.parentElement.innerHTML='<div class=\"table-logo-placeholder\">No Logo</div>'">`
                : '<div class="table-logo-placeholder">No Logo</div>'
            }
          </td>
          <td>${reseller.name}</td>
          <td>${reseller.description || '-'}</td>
          <td>
            ${
              reseller.website_url
                ? `<a href="${reseller.website_url}" target="_blank" class="btn btn-primary btn-sm">Visit</a>`
                : '<span class="text-muted">-</span>'
            }
          </td>
          <td>
            ${
              reseller.location_url
                ? `<a href="${reseller.location_url}" target="_blank" class="btn btn-secondary btn-sm">View</a>`
                : '<span class="text-muted">-</span>'
            }
          </td>
          <td>
            <div class="table-actions">
              <button onclick="showEditResellerModal(${JSON.stringify(reseller).replace(/"/g,'&quot;')})" class="btn btn-secondary btn-sm">Edit</button>
              <button onclick="confirmDeleteReseller(${reseller.id}, '${reseller.name}')" class="btn btn-danger btn-sm">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function updatePagination() {
  if (!paginationInfo || !pageInfo || !prevPageBtn || !nextPageBtn) return;

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
  if (!resultsDiv) return;

  const errorArray = Array.isArray(result.errors)
    ? result.errors
    : Array.isArray(result.results?.errors)
    ? result.results.errors
    : [];
  const errorCount =
    typeof result.errorCount === "number"
      ? result.errorCount
      : Array.isArray(result.errors)
      ? result.errors.length
      : 0;

  const hasErrors = errorCount > 0 || errorArray.length > 0;

  resultsDiv.className = `import-results ${hasErrors ? "error" : ""}`;
  resultsDiv.style.display = "block";

  resultsDiv.innerHTML = `
        <h4>Import Results</h4>
        <p><strong>Imported:</strong> ${
          Number(result.imported) || 0
        } resellers</p>
        <p><strong>Errors:</strong> ${errorCount || errorArray.length}</p>
        ${
          (errorCount || errorArray.length) > 0
            ? `
            <details>
                <summary>View Errors</summary>
                <ul>
                    ${(errorArray || [])
                      .map(
                        (e) => `<li>${(e && e.error) || "Unknown error"}</li>`
                      )
                      .join("")}
                </ul>
            </details>
        `
            : ""
        }
        <div class="import-results-actions" style="margin-top: 15px;">
          <button onclick="hideImportModal()" class="btn btn-primary">Close</button>
        </div>
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
  if (loadingOverlay) loadingOverlay.style.display = "flex";
}

function hideLoading() {
  if (loadingOverlay) loadingOverlay.style.display = "none";
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

// Make functions globally available for onclick handlers (fallback)
window.showAddResellerModal = showAddResellerModal;
window.showEditResellerModal = showEditResellerModal;
window.confirmDeleteReseller = confirmDeleteReseller;

// Additional fallback: Try to set up event listener again after a short delay
setTimeout(() => {
  const fallbackBtn = document.getElementById("addResellerBtn");
  if (fallbackBtn && !fallbackBtn.hasAttribute("data-listener-added")) {
    console.log("Setting up fallback event listener for Add Reseller button");
    fallbackBtn.addEventListener("click", function (e) {
      console.log("Fallback: Add Reseller button clicked!");
      e.preventDefault();
      showAddResellerModal();
    });
    fallbackBtn.setAttribute("data-listener-added", "true");
  }
}, 1000);
