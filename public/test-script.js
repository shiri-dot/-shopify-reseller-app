// Simple test script to verify script loading
console.log('🧪 TEST SCRIPT LOADED - This should appear in console');

// Create a simple test element
const testDiv = document.createElement('div');
testDiv.id = 'test-reseller-script';
testDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #007bff;
    color: white;
    padding: 15px;
    border-radius: 8px;
    z-index: 9999;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
`;
testDiv.innerHTML = '🧪 TEST: Script is working!';

document.body.appendChild(testDiv);

// Remove after 5 seconds
setTimeout(() => {
    if (testDiv.parentNode) {
        testDiv.parentNode.removeChild(testDiv);
    }
}, 5000);

console.log('🧪 TEST ELEMENT CREATED');
