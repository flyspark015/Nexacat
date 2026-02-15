# AI Prompts for FlySpark Product Extraction

This directory contains production-grade prompts for AI-powered product data extraction.

## Available Prompts

### 1. **extract_main_product_images_headless_chromium.md**
**Purpose:** Extract main product images from product pages with 100% confidence using headless browser automation.

**Use Case:**
- When you need to extract product images from dynamic websites (React, Next.js, Vue)
- When images are lazy-loaded or require JavaScript execution
- When you need to identify the MAIN product image (not thumbnails or UI elements)
- When multiple image resolutions exist and you need the highest quality

**Requirements:**
- Headless browser (Puppeteer or Playwright)
- Node.js environment
- Product URL

**Output:**
- Full rendered HTML (after JavaScript execution)
- List of detected images with confidence scores
- Highest-resolution image URLs
- Detailed reasoning for each image selection
- JSON results file

**Success Criteria:**
- Images with score >= 100 (high confidence)
- Resolution >= 600×600 pixels
- Full absolute URLs (not relative paths)
- Proof/reasoning for each selection

---

## How to Use These Prompts

### Method 1: With GPT-5.2 (Recommended)
1. Copy the entire content of the prompt file
2. Replace `INSERT_PRODUCT_URL_HERE` with your target product URL
3. Provide to GPT-5.2 (best quality) or GPT-4.1 (most intelligent)
4. GPT will execute the extraction and return results

### Method 2: With Local Headless Browser
1. Install Puppeteer: `npm install puppeteer`
2. Copy the code from the prompt
3. Replace the URL placeholder
4. Run: `node extract_product_images.js`
5. Check output files: `extracted_page.html` and `product_images.json`

### Method 3: Within FlySpark AI Assistant
1. The AI Assistant automatically uses these prompts
2. Just provide a product URL
3. The system will use the comprehensive extraction protocol
4. Results appear in the AI chat with step-by-step progress

---

## Prompt Engineering Principles

All prompts in this directory follow these principles:

### 1. **Execution Flow First**
- Clear step-by-step instructions
- Explicit ordering (Step 1, Step 2, etc.)
- No ambiguity in what to do next

### 2. **Wait for Full Load**
- Network idle checks
- DOM stability verification
- Lazy-load triggering (scroll, hover)
- Image load completion

### 3. **Intelligent Analysis**
- Multi-factor scoring system
- Positive and negative indicators
- Context awareness (schema.org, container classes)
- Resolution preference

### 4. **High-Confidence Output**
- Only return items with score >= threshold
- Provide reasoning/proof for selections
- Select highest resolution variants
- Return full absolute URLs

### 5. **Robustness**
- Handle dynamic rendering (SPAs)
- Timeout protection
- Error handling with fallbacks
- Alternative extraction methods

### 6. **Transparency**
- Print full HTML or save to file
- Show line counts and snippets
- Explain scoring decisions
- List all URL variants

---

## Image Detection Scoring System

### Positive Indicators
| Factor | Points | Description |
|--------|--------|-------------|
| Product Schema Markup | +100 | Inside `<div itemtype="Product">` |
| Product Gallery Container | +80 | Class contains "product-gallery", "main-image" |
| High Resolution (>=1000×1000) | +60 | Large natural dimensions |
| Large Display Area | +50 | Prominently visible on screen |
| Above the Fold | +40 | Visible without scrolling |
| Horizontally Centered | +30 | Center of viewport |
| Product Alt Text | +25 | Alt contains "product", "main", etc. |
| Product URL Pattern | +20 | URL contains "product", "large" |

### Negative Indicators
| Factor | Points | Description |
|--------|--------|-------------|
| Advertisement | -100 | Class/URL contains "ad", "sponsor" |
| UI Element | -80 | Logo, icon, badge, nav, menu |
| Related Products | -70 | "related", "recommended", "upsell" |
| Thumbnail | -60 | "thumb", "thumbnail", "small" |

### Confidence Levels
- **VERY HIGH (>= 150):** Main product hero image
- **HIGH (>= 100):** Primary product gallery image
- **MEDIUM (50-99):** Possible product image
- **LOW (< 50):** Likely not main product

---

## Example Usage

```javascript
// Example 1: Extract from Amazon product page
const targetUrl = 'https://www.amazon.com/dp/B08L5VN4KP';
// Output: Main product images with srcset variants
// Result: https://m.media-amazon.com/images/I/71ABC123DEF._AC_SL1500_.jpg (1500x1500)

// Example 2: Extract from Shopify store
const targetUrl = 'https://store.example.com/products/led-bulb-10w';
// Output: Detects main image from product gallery
// Result: https://cdn.shopify.com/s/files/1/0123/4567/products/bulb_2048x2048.jpg

// Example 3: Extract from custom React site
const targetUrl = 'https://supplier.example.com/product/12345';
// Output: Waits for React to render, then extracts
// Result: Multiple angles detected with confidence scores
```

---

## Troubleshooting

### Issue: No images detected with high confidence
**Solution:**
- Check if page requires authentication
- Verify JavaScript executed fully (increase wait time)
- Review the HTML file to see actual page structure
- Manually inspect low-scoring images in JSON output

### Issue: Page load timeout
**Solution:**
- Increase timeout values (try 60-90 seconds)
- Check internet connection
- Verify URL is accessible
- Use `page.waitForSelector()` for specific elements

### Issue: Wrong images selected
**Solution:**
- Review scoring reasoning in JSON output
- Adjust scoring weights in the prompt
- Add custom exclusion patterns
- Manually filter results by resolution/size

---

## Contributing

When adding new prompts:

1. **Follow naming convention:** `action_resource_method.md`
2. **Include these sections:**
   - Mission (clear objective)
   - Execution Flow (step-by-step)
   - Output Requirements
   - Success Criteria
   - Example Usage
3. **Test with real URLs** before committing
4. **Document scoring/decision logic**
5. **Provide fallback strategies**

---

## Changelog

### v1.0 - February 15, 2026
- Initial release
- Added `extract_main_product_images_headless_chromium.md`
- Implemented multi-factor scoring system
- Added srcset and picture element support
- Included comprehensive documentation

---

## License

These prompts are part of the FlySpark B2B Product Catalog system.
For internal use only. Not for public distribution.
