// Extension popup script
document.addEventListener("DOMContentLoaded", function () {
  const statusDiv = document.getElementById("status");
  const refreshBtn = document.getElementById("refresh");
  const openShopifyBtn = document.getElementById("openShopify");

  function updateStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      const url = currentTab.url;

      if (
        url &&
        (url.includes("myshopify.com/admin/products") ||
          url.includes("admin.shopify.com/store/"))
      ) {
        statusDiv.className = "status active";
        statusDiv.textContent =
          "✅ Active on product page - Reseller selection available!";
      } else {
        statusDiv.className = "status inactive";
        statusDiv.textContent =
          "⚠️ Go to a Shopify product page to use this extension";
      }
    });
  }

  refreshBtn.addEventListener("click", updateStatus);

  openShopifyBtn.addEventListener("click", function () {
    chrome.tabs.create({ url: "https://admin.shopify.com" });
  });

  // Initial status check
  updateStatus();
});
