// ==UserScript==
// @name         Shopify Reseller Selector
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically adds reseller selection to Shopify product pages
// @author       You
// @match        https://*.myshopify.com/admin/products/*
// @match        https://admin.shopify.com/store/*/products/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('🏪 Shopify Reseller UserScript Loading...');
    
    // Load the auto-reseller script
    const script = document.createElement('script');
    script.src = 'https://raw.githubusercontent.com/shiri-dot/-shopify-reseller-app/main/public/shopify-auto-reseller.js';
    script.onload = function() {
        console.log('✅ Auto-reseller script loaded via UserScript!');
    };
    script.onerror = function() {
        console.error('❌ Failed to load auto-reseller script');
    };
    
    document.head.appendChild(script);
})();
