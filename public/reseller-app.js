// Reseller App JavaScript for Shopify Theme Integration

class ResellerApp {
  constructor() {
    this.productHandle = null;
    this.resellers = [];
    this.productResellers = [];
    this.apiBaseUrl = window.location.origin; // Adjust this to your app's URL
    
    this.init();
  }

  async init() {
    this.productHandle = this.getProductHandle();
    
    if (!this.productHandle) {
      console.warn('ResellerApp: Could not determine product handle');
      return;
    }

    await this.loadData();
    this.setupUI();
  }

  getProductHandle() {
    // Try to get from data attribute first
    const container = document.getElementById('reseller-app-container');
    if (container && container.dataset.productHandle) {
      return container.dataset.productHandle;
    }

    // Fallback: extract from URL
    const match = window.location.pathname.match(/\/products\/([^\/]+)/);
    return match ? match[1] : null;
  }

  async loadData() {
    try {
      await Promise.all([
        this.loadAllResellers(),
        this.loadProductResellers()
      ]);
    } catch (error) {
      console.error('Error loading reseller data:', error);
      this.showError();
    }
  }

  async loadAllResellers() {
    const response = await fetch(`${this.apiBaseUrl}/api/resellers`);
    if (!response.ok) throw new Error('Failed to load resellers');
    
    this.resellers = await response.json();
  }

  async loadProductResellers() {
    const response = await fetch(`${this.apiBaseUrl}/api/products/${this.productHandle}/resellers`);
    if (!response.ok) throw new Error('Failed to load product resellers');
    
    this.productResellers = await response.json();
  }

  setupUI() {
    this.hideLoading();
    this.showContent();
    this.populateResellerSelect();
    this.setupEventListeners();
  }

  hideLoading() {
    const loading = document.getElementById('reseller-loading');
    if (loading) loading.style.display = 'none';
  }

  showContent() {
    const content = document.getElementById('reseller-content');
    if (content) content.style.display = 'block';
  }

  showError() {
    const loading = document.getElementById('reseller-loading');
    const error = document.getElementById('reseller-error');
    
    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'block';
  }

  setupEventListeners() {
    const resellerSelect = document.getElementById('reseller-select');
    const selectAllBtn = document.getElementById('select-all-resellers');
    const clearBtn = document.getElementById('clear-resellers');

    if (resellerSelect) {
      resellerSelect.addEventListener('change', () => this.handleResellerSelection());
    }

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => this.selectAllResellers());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAllResellers());
    }
  }

  populateResellerSelect() {
    const resellerSelect = document.getElementById('reseller-select');
    if (!resellerSelect) return;

    // Clear existing options
    resellerSelect.innerHTML = '';

    // Add reseller options
    this.resellers.forEach(reseller => {
      const option = document.createElement('option');
      option.value = reseller.id;
      option.textContent = reseller.name;
      option.selected = this.productResellers.some(pr => pr.id === reseller.id);
      resellerSelect.appendChild(option);
    });

    this.updateSelectedResellersDisplay();
  }

  handleResellerSelection() {
    const resellerSelect = document.getElementById('reseller-select');
    const selectedOptions = Array.from(resellerSelect.selectedOptions);
    const selectedResellerIds = selectedOptions.map(option => parseInt(option.value));

    this.saveProductResellers(selectedResellerIds);
    this.updateSelectedResellersDisplay();
  }

  selectAllResellers() {
    const resellerSelect = document.getElementById('reseller-select');
    if (!resellerSelect) return;

    Array.from(resellerSelect.options).forEach(option => {
      option.selected = true;
    });

    this.handleResellerSelection();
  }

  clearAllResellers() {
    const resellerSelect = document.getElementById('reseller-select');
    if (!resellerSelect) return;

    Array.from(resellerSelect.options).forEach(option => {
      option.selected = false;
    });

    this.handleResellerSelection();
  }

  async saveProductResellers(resellerIds) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/products/${this.productHandle}/resellers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resellerIds }),
      });

      if (!response.ok) throw new Error('Failed to save product resellers');

      const result = await response.json();
      
      // Update local data
      this.productResellers = this.resellers.filter(r => resellerIds.includes(r.id));
      
      this.showNotification('Resellers updated successfully!', 'success');

    } catch (error) {
      console.error('Error saving product resellers:', error);
      this.showNotification('Failed to update resellers', 'error');
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
    const selectedOptions = Array.from(resellerSelect.selectedOptions);
    const selectedResellerIds = selectedOptions.map((option) =>
      parseInt(option.value)
    );

    // Update product resellers
    this.saveProductResellers(selectedResellerIds);

    // Update display
    this.updateSelectedResellersDisplay();
  }

  updateSelectedResellersDisplay() {
    const resellerSelect = document.getElementById('reseller-select');
    const selectedResellersDiv = document.getElementById('selected-resellers');
    const mapContainer = document.getElementById('reseller-map-container');

    if (!resellerSelect || !selectedResellersDiv) return;

    const selectedOptions = Array.from(resellerSelect.selectedOptions);
    const selectedResellers = selectedOptions
      .map(option => {
        const resellerId = parseInt(option.value);
        return this.resellers.find(r => r.id === resellerId);
      })
      .filter(Boolean);

    if (selectedResellers.length === 0) {
      selectedResellersDiv.innerHTML = '<p class="no-resellers">No resellers selected</p>';
      if (mapContainer) mapContainer.style.display = 'none';
      return;
    }

    // Display selected resellers
    selectedResellersDiv.innerHTML = `
      <h4>Selected Resellers (${selectedResellers.length})</h4>
      <div class="reseller-cards">
        ${selectedResellers.map(reseller => `
          <div class="reseller-card">
            <div class="reseller-card-header">
              ${reseller.logo_url 
                ? `<img src="${reseller.logo_url}" alt="${reseller.name}" class="reseller-card-logo" onerror="this.style.display='none'">`
                : '<div class="reseller-card-logo-placeholder">No Logo</div>'
              }
              <div class="reseller-card-info">
                <h5 class="reseller-card-name">${reseller.name}</h5>
                ${reseller.description ? `<p class="reseller-card-description">${reseller.description}</p>` : ''}
              </div>
            </div>
            <div class="reseller-card-actions">
              ${reseller.website_url ? `<a href="${reseller.website_url}" target="_blank" class="btn btn-primary btn-sm">Visit Website</a>` : ''}
              ${reseller.location_url ? `<a href="${reseller.location_url}" target="_blank" class="btn btn-secondary btn-sm">View Location</a>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Show map if there are resellers with coordinates
    const resellersWithCoords = selectedResellers.filter(r => r.latitude && r.longitude);
    if (resellersWithCoords.length > 0 && mapContainer) {
      mapContainer.style.display = 'block';
      this.initializeResellerMap(resellersWithCoords);
    } else if (mapContainer) {
      mapContainer.style.display = 'none';
    }
  }

  initializeResellerMap(resellers) {
    const mapElement = document.getElementById('reseller-map');
    if (!mapElement || typeof google === 'undefined') return;

    // Clear existing map
    mapElement.innerHTML = '';

    const map = new google.maps.Map(mapElement, {
      zoom: 2,
      center: { lat: 0, lng: 0 },
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    });

    const bounds = new google.maps.LatLngBounds();
    const markers = [];

    resellers.forEach(reseller => {
      if (reseller.latitude && reseller.longitude) {
        const position = { lat: reseller.latitude, lng: reseller.longitude };

        const marker = new google.maps.Marker({
          position: position,
          map: map,
          title: reseller.name,
          icon: {
            url: reseller.logo_url || 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(30, 30),
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 200px;">
              <h4 style="margin: 0 0 8px 0;">${reseller.name}</h4>
              ${reseller.description ? `<p style="margin: 0 0 8px 0; font-size: 14px;">${reseller.description}</p>` : ''}
              ${reseller.website_url ? `<a href="${reseller.website_url}" target="_blank" style="color: #007bff; text-decoration: none;">Visit Website</a>` : ''}
            </div>
          `,
        });

        marker.addListener('click', () => {
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

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `reseller-notification reseller-notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '1rem 1.5rem',
      borderRadius: '6px',
      color: '#fff',
      fontWeight: '500',
      zIndex: '1000',
      animation: 'slideIn 0.3s ease',
      backgroundColor: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'
    });

    // Add animation keyframes if not already present
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  new ResellerApp();
});