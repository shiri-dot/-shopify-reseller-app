// Quick test script loader for Shopify admin
console.log("🚀 Loading reseller script...");

// Load the script from your deployed app
const script = document.createElement('script');
script.src = 'https://shopify-reseller-app-production.up.railway.app/public/shopify-admin-reseller.js';
script.onload = function() {
    console.log("✅ Reseller script loaded successfully!");
    console.log("🔧 You should see debug buttons in the top-right corner in 3 seconds...");
};
script.onerror = function() {
    console.error("❌ Failed to load reseller script. Check your app URL.");
};

document.head.appendChild(script);

// Also try to trigger manually after a delay
setTimeout(() => {
    if (typeof window.triggerResellerInit === 'function') {
        console.log("🎯 Manually triggering reseller initialization...");
        window.triggerResellerInit();
    } else {
        console.log("⚠️ Manual trigger function not found. Script may not have loaded properly.");
    }
}, 5000);
