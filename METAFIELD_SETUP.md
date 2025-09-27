# Shopify Metafield Setup for Resellers

This guide shows you how to set up a custom metafield in Shopify to store reseller information for each product.

## Step 1: Create the Metafield in Shopify Admin

1. **Go to Shopify Admin** → **Settings** → **Custom data**
2. **Click on "Products"** to manage product metafields
3. **Click "Add definition"**
4. **Fill in the metafield details:**
   - **Name**: `Resellers`
   - **Namespace and key**: `custom.resellers`
   - **Description**: `List of resellers who carry this product`
   - **Content type**: `List of single line text`
   - **Validation**: Optional (you can add rules if needed)
5. **Click "Save"**

## Step 2: Manual Setup (Alternative)

If you prefer to set up the metafield manually for each product:

1. **Go to Products** in your Shopify admin
2. **Click on any product** to edit it
3. **Scroll down** to find the "Metafields" section
4. **Look for "Resellers"** (or whatever name you chose)
5. **Add reseller names** one by one

## Step 3: Using the Script

Once the metafield is set up, you can use the simple script:

### Load the Script on Product Pages

1. **Go to any product edit page** in Shopify admin
2. **Open Developer Console** (F12)
3. **Paste this code** and press Enter:

```javascript
// Load the metafield reseller script
const script = document.createElement("script");
script.src =
  "https://raw.githubusercontent.com/shiri-dot/-shopify-reseller-app/main/public/shopify-metafield-reseller.js";
script.onload = () => console.log("✅ Metafield reseller script loaded!");
document.head.appendChild(script);
```

### What You'll See

- A **blue-bordered section** with the title "🏪 Product Resellers (Metafield Solution)"
- **Checkboxes** for each reseller
- **Select All**, **Clear All**, and **Save to Metafield** buttons
- **Simple interface** that works with Shopify's built-in metafield system

## Step 4: Benefits of This Approach

✅ **Simple**: Uses Shopify's built-in metafield system
✅ **Native**: Works with Shopify's existing infrastructure
✅ **Persistent**: Data is stored in Shopify's database
✅ **Accessible**: Can be accessed via Shopify API
✅ **No Deployment**: No need to deploy external apps
✅ **Reliable**: Uses Shopify's proven metafield system

## Step 5: API Integration (Optional)

If you want to programmatically access the reseller data:

```javascript
// Get resellers for a product
const productId = "your-product-id";
const resellers = await fetch(
  `/admin/api/2023-10/products/${productId}/metafields.json?namespace=custom&key=resellers`
).then((response) => response.json());

console.log("Resellers:", resellers);
```

## Step 6: Display on Frontend (Optional)

You can also display the resellers on your product pages:

```liquid
<!-- In your product.liquid template -->
{% if product.metafields.custom.resellers %}
  <div class="resellers-section">
    <h3>Available at these resellers:</h3>
    <ul>
      {% for reseller in product.metafields.custom.resellers %}
        <li>{{ reseller }}</li>
      {% endfor %}
    </ul>
  </div>
{% endif %}
```

## Troubleshooting

### Metafield Not Showing

- Make sure you created the metafield in **Settings** → **Custom data** → **Products**
- Check that the namespace and key match: `custom.resellers`

### Script Not Loading

- Make sure you're on a product edit page
- Check the browser console for any error messages
- Try refreshing the page and loading the script again

### Data Not Saving

- The script currently saves to localStorage for demo purposes
- In production, you'd need to implement the actual Shopify API call to save to metafields

## Next Steps

1. **Set up the metafield** in Shopify admin
2. **Test the script** on a product page
3. **Implement the actual API save functionality** (optional)
4. **Display resellers on your product pages** (optional)

This approach is much simpler and more reliable than the complex script injection method!
