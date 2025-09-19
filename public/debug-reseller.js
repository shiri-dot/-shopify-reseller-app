// Debug version of the reseller selection script
console.log('🔍 DEBUG: Reseller script starting...');
console.log('🔍 DEBUG: Current URL:', window.location.href);
console.log('🔍 DEBUG: Current pathname:', window.location.pathname);
console.log('🔍 DEBUG: Hostname:', window.location.hostname);

// Check if we're on the right page
const isProductPage = window.location.pathname.includes('/admin/products/');
const hasEdit = window.location.pathname.includes('/edit');
const hasProductId = window.location.pathname.match(/\/admin\/products\/\d+/);

console.log('🔍 DEBUG: Is product page:', isProductPage);
console.log('🔍 DEBUG: Has edit:', hasEdit);
console.log('🔍 DEBUG: Has product ID:', hasProductId);

// Create a debug panel
const debugPanel = document.createElement('div');
debugPanel.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: #2c3e50;
    color: white;
    padding: 15px;
    border-radius: 8px;
    z-index: 10000;
    font-family: monospace;
    font-size: 12px;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
`;
debugPanel.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 10px;">🔍 DEBUG INFO</div>
    <div>URL: ${window.location.href}</div>
    <div>Path: ${window.location.pathname}</div>
    <div>Is Product Page: ${isProductPage}</div>
    <div>Has Edit: ${hasEdit}</div>
    <div>Has Product ID: ${hasProductId}</div>
    <div>Should Load: ${isProductPage && (hasEdit || hasProductId)}</div>
    <div style="margin-top: 10px; color: #f39c12;">Check console for more details</div>
`;

document.body.appendChild(debugPanel);

// Remove debug panel after 10 seconds
setTimeout(() => {
    if (debugPanel.parentNode) {
        debugPanel.parentNode.removeChild(debugPanel);
    }
}, 10000);

// Now try to load the actual reseller script
if (isProductPage && (hasEdit || hasProductId)) {
    console.log('🔍 DEBUG: Conditions met, loading reseller script...');
    
    // Create the reseller selection UI
    const resellerSection = document.createElement('div');
    resellerSection.id = 'debug-reseller-section';
    resellerSection.style.cssText = `
        background: white;
        border: 2px solid #28a745;
        border-radius: 8px;
        padding: 20px;
        margin: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif;
    `;
    
    resellerSection.innerHTML = `
        <h3 style="color: #28a745; margin: 0 0 15px 0;">🏪 DEBUG: Reseller Selection</h3>
        <p>This is a test to see if the script can create elements on the page.</p>
        <div style="background: #e3f2fd; padding: 10px; border-radius: 4px; margin: 10px 0;">
            <strong>Test Checkbox:</strong> <input type="checkbox" id="test-checkbox"> Test Reseller
        </div>
        <button onclick="alert('Button clicked!')" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
        ">Test Button</button>
    `;
    
    // Try to find a good insertion point
    const possibleContainers = [
        '.Polaris-Page__Content',
        '.admin-content',
        '.product-details',
        '.product-editor',
        'main',
        '.content',
        'body'
    ];
    
    let insertionPoint = document.body;
    let foundContainer = false;
    
    for (const selector of possibleContainers) {
        const element = document.querySelector(selector);
        if (element) {
            insertionPoint = element;
            foundContainer = true;
            console.log('🔍 DEBUG: Found container:', selector);
            break;
        }
    }
    
    if (!foundContainer) {
        console.log('🔍 DEBUG: No container found, using body');
    }
    
    insertionPoint.appendChild(resellerSection);
    console.log('🔍 DEBUG: Reseller section added to page');
    
} else {
    console.log('🔍 DEBUG: Conditions not met, not loading reseller script');
    console.log('🔍 DEBUG: isProductPage:', isProductPage);
    console.log('🔍 DEBUG: hasEdit:', hasEdit);
    console.log('🔍 DEBUG: hasProductId:', hasProductId);
}

console.log('🔍 DEBUG: Script execution complete');
