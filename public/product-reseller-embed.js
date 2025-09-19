// Product Reseller Selection - Embedded in Shopify Admin
// This script adds a reseller selection section to the product editing page

(function() {
    'use strict';
    
    // Configuration
    const API_BASE_URL = window.location.origin; // or your deployed app URL
    const RESELLER_SECTION_ID = 'reseller-selection-section';
    
    // Wait for DOM to be ready
    function waitForElement(selector, callback) {
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
        } else {
            setTimeout(() => waitForElement(selector, callback), 100);
        }
    }
    
    // Create the reseller selection section
    function createResellerSection() {
        const section = document.createElement('div');
        section.id = RESELLER_SECTION_ID;
        section.innerHTML = `
            <div style="
                background: white;
                border: 1px solid #e1e3e5;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #e1e3e5;
                ">
                    <h3 style="margin: 0; color: #2c3e50; font-size: 16px;">
                        🏪 Select Resellers
                    </h3>
                    <div style="display: flex; gap: 8px;">
                        <button id="select-all-resellers" style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                        ">Select All</button>
                        <button id="clear-all-resellers" style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                        ">Clear All</button>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                        Choose which resellers carry this product:
                    </p>
                    <div id="selected-count" style="
                        background: #e3f2fd;
                        padding: 8px 12px;
                        border-radius: 4px;
                        font-size: 14px;
                        color: #1976d2;
                        margin-bottom: 15px;
                    ">0 reseller(s) selected</div>
                </div>
                
                <div id="reseller-list" style="
                    max-height: 300px;
                    overflow-y: auto;
                    margin-bottom: 15px;
                ">
                    <div style="text-align: center; padding: 20px; color: #6c757d;">
                        Loading resellers...
                    </div>
                </div>
                
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 15px;
                    border-top: 1px solid #e1e3e5;
                ">
                    <div id="selected-resellers-list" style="
                        font-size: 12px;
                        color: #6c757d;
                        flex: 1;
                    "></div>
                    <button id="save-resellers" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                    ">Save Resellers</button>
                </div>
                
                <div id="reseller-messages" style="margin-top: 15px;"></div>
            </div>
        `;
        
        return section;
    }
    
    // Load resellers from API
    async function loadResellers() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/resellers`);
            if (!response.ok) throw new Error('Failed to load resellers');
            return await response.json();
        } catch (error) {
            console.error('Error loading resellers:', error);
            showMessage('Error loading resellers: ' + error.message, 'error');
            return [];
        }
    }
    
    // Load product resellers
    async function loadProductResellers(productId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}/resellers`);
            if (!response.ok) throw new Error('Failed to load product resellers');
            const data = await response.json();
            return data.map(r => r.id);
        } catch (error) {
            console.error('Error loading product resellers:', error);
            return [];
        }
    }
    
    // Save product resellers
    async function saveProductResellers(productId, resellerIds) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}/resellers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resellerIds }),
            });
            
            if (!response.ok) throw new Error('Failed to save resellers');
            return true;
        } catch (error) {
            console.error('Error saving resellers:', error);
            throw error;
        }
    }
    
    // Render resellers list
    function renderResellers(resellers, selectedResellers) {
        const list = document.getElementById('reseller-list');
        if (!list) return;
        
        if (resellers.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">No resellers available.</div>';
            return;
        }
        
        list.innerHTML = resellers.map(reseller => `
            <div style="
                display: flex;
                align-items: center;
                padding: 10px;
                border: 1px solid #e1e3e5;
                border-radius: 4px;
                margin-bottom: 8px;
                background: ${selectedResellers.includes(reseller.id) ? '#f0f8ff' : 'white'};
                border-color: ${selectedResellers.includes(reseller.id) ? '#007bff' : '#e1e3e5'};
                transition: all 0.2s ease;
            " onmouseover="this.style.borderColor='#007bff'" onmouseout="this.style.borderColor='${selectedResellers.includes(reseller.id) ? '#007bff' : '#e1e3e5'}'">
                <input type="checkbox" 
                       style="margin-right: 12px; transform: scale(1.1);"
                       ${selectedResellers.includes(reseller.id) ? 'checked' : ''}
                       onchange="toggleReseller(${reseller.id})">
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: #2c3e50; margin-bottom: 2px;">${reseller.name}</div>
                    ${reseller.description ? `<div style="font-size: 12px; color: #6c757d;">${reseller.description}</div>` : ''}
                </div>
                ${reseller.logo_url ? `<img src="${reseller.logo_url}" alt="${reseller.name}" style="width: 30px; height: 30px; border-radius: 4px; object-fit: cover;" onerror="this.style.display='none'">` : ''}
            </div>
        `).join('');
    }
    
    // Update selected count and list
    function updateSelectedDisplay(selectedResellers, resellers) {
        const count = selectedResellers.length;
        const countElement = document.getElementById('selected-count');
        const listElement = document.getElementById('selected-resellers-list');
        
        if (countElement) {
            countElement.textContent = `${count} reseller(s) selected`;
            countElement.style.background = count > 0 ? '#d4edda' : '#e3f2fd';
            countElement.style.color = count > 0 ? '#155724' : '#1976d2';
        }
        
        if (listElement && count > 0) {
            const selectedNames = selectedResellers.map(id => {
                const reseller = resellers.find(r => r.id === id);
                return reseller ? reseller.name : '';
            }).filter(Boolean);
            listElement.textContent = `Selected: ${selectedNames.join(', ')}`;
        } else if (listElement) {
            listElement.textContent = '';
        }
    }
    
    // Show message
    function showMessage(message, type) {
        const messagesDiv = document.getElementById('reseller-messages');
        if (!messagesDiv) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            padding: 10px 15px;
            border-radius: 4px;
            margin-bottom: 10px;
            font-size: 14px;
            background: ${type === 'error' ? '#f8d7da' : '#d4edda'};
            color: ${type === 'error' ? '#721c24' : '#155724'};
            border: 1px solid ${type === 'error' ? '#f5c6cb' : '#c3e6cb'};
        `;
        messageDiv.textContent = message;
        
        messagesDiv.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
    
    // Global variables
    let allResellers = [];
    let selectedResellers = [];
    let currentProductId = null;
    
    // Toggle reseller selection
    window.toggleReseller = function(resellerId) {
        const index = selectedResellers.indexOf(resellerId);
        if (index > -1) {
            selectedResellers.splice(index, 1);
        } else {
            selectedResellers.push(resellerId);
        }
        
        renderResellers(allResellers, selectedResellers);
        updateSelectedDisplay(selectedResellers, allResellers);
    };
    
    // Select all resellers
    document.addEventListener('click', function(e) {
        if (e.target.id === 'select-all-resellers') {
            selectedResellers = allResellers.map(r => r.id);
            renderResellers(allResellers, selectedResellers);
            updateSelectedDisplay(selectedResellers, allResellers);
        }
        
        if (e.target.id === 'clear-all-resellers') {
            selectedResellers = [];
            renderResellers(allResellers, selectedResellers);
            updateSelectedDisplay(selectedResellers, allResellers);
        }
        
        if (e.target.id === 'save-resellers') {
            saveResellers();
        }
    });
    
    // Save resellers
    async function saveResellers() {
        if (!currentProductId) {
            showMessage('No product ID found', 'error');
            return;
        }
        
        const saveBtn = document.getElementById('save-resellers');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }
        
        try {
            await saveProductResellers(currentProductId, selectedResellers);
            showMessage('Resellers updated successfully!', 'success');
        } catch (error) {
            showMessage('Error saving resellers: ' + error.message, 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Resellers';
            }
        }
    }
    
    // Initialize the reseller selection
    async function initializeResellerSelection() {
        // Get product ID from URL
        const pathParts = window.location.pathname.split('/');
        const productIndex = pathParts.indexOf('products');
        if (productIndex !== -1 && pathParts[productIndex + 1]) {
            currentProductId = pathParts[productIndex + 1];
        }
        
        if (!currentProductId) {
            console.warn('Could not determine product ID');
            return;
        }
        
        // Load data
        allResellers = await loadResellers();
        selectedResellers = await loadProductResellers(currentProductId);
        
        // Render the interface
        renderResellers(allResellers, selectedResellers);
        updateSelectedDisplay(selectedResellers, allResellers);
    }
    
    // Main initialization
    function init() {
        console.log('🏪 Reseller Selection Script Loading...');
        console.log('Current URL:', window.location.href);
        console.log('Current pathname:', window.location.pathname);
        
        // Check if we're on a product editing page in Shopify admin
        if (!window.location.pathname.includes('/admin/products/') || 
            (!window.location.pathname.includes('/edit') && !window.location.pathname.includes('/products/'))) {
            console.log('❌ Not on a product editing page, skipping reseller selection');
            return;
        }
        
        console.log('✅ On product editing page, initializing reseller selection...');
        
        // Wait for the product form to be available - try multiple selectors for Shopify admin
        waitForElement('.product-form, .product-single__form, [data-product-form], .Polaris-Page, .product-details, .product-edit-form, form[action*="products"], .admin-product-form, .product-editor', function(productForm) {
            console.log('✅ Found product form:', productForm);
            
            // Check if reseller section already exists
            if (document.getElementById(RESELLER_SECTION_ID)) {
                console.log('❌ Reseller section already exists, skipping');
                return;
            }
            
            console.log('🏗️ Creating reseller section...');
            
            // Try to find a good insertion point
            let insertionPoint = productForm;
            
            // Look for common Shopify admin containers
            const adminContainer = document.querySelector('.Polaris-Page__Content, .admin-content, .product-details, .product-editor, .product-form-container');
            if (adminContainer) {
                insertionPoint = adminContainer;
                console.log('✅ Found admin container:', adminContainer);
            }
            
            // Create and insert the reseller section
            const resellerSection = createResellerSection();
            insertionPoint.appendChild(resellerSection);
            
            console.log('✅ Reseller section created and inserted');
            
            // Initialize the functionality
            initializeResellerSelection();
        });
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
