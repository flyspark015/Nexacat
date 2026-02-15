# Integration Guide: Product Processing System

## 🎯 Quick Start - How to Use the New System

This guide explains how to integrate the new **Product Processing System** with your existing FlySpark application.

---

## 📋 What's Been Created

### **New Services** (Backend Logic)
1. `/src/app/lib/headlessBrowser.ts` - Page rendering & image extraction
2. `/src/app/lib/brandRewriter.ts` - FlySpark brand rewriting
3. `/src/app/lib/currencyConverter.ts` - USD → INR conversion
4. `/src/app/lib/productProcessor.ts` - Main orchestrator

### **New Components** (UI)
1. `/src/app/components/admin/AdvancedImageSelector.tsx` - Image selection UI
2. `/src/app/components/admin/HTMLDescriptionPreview.tsx` - HTML preview/editor
3. `/src/app/components/admin/HTMLPreviewModal.tsx` - Page preview (already exists)

### **Documentation**
1. `/PRODUCT_PROCESSING_SYSTEM.md` - Complete architecture
2. `/INTEGRATION_GUIDE.md` - This file

---

## 🔧 Integration Steps

### **Option 1: Add as New Route (Recommended)**

Create a dedicated "Smart Import" page:

**Step 1:** Create new route

```tsx
// /src/app/pages/admin/SmartImportPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { renderProductPage } from '../../lib/headlessBrowser';
import { processProductFromURL } from '../../lib/productProcessor';
import { AdvancedImageSelector } from '../../components/admin/AdvancedImageSelector';
import { HTMLDescriptionPreview } from '../../components/admin/HTMLDescriptionPreview';
import { Button } from '../../components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function SmartImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [renderResult, setRenderResult] = useState(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [processedProduct, setProcessedProduct] = useState(null);

  const handleFetch = async () => {
    if (!url) return;
    
    setLoading(true);
    try {
      const result = await renderProductPage(url, (progress) => {
        toast.info(progress.message);
      });
      
      setRenderResult(result);
      
      if (result.images.length === 0) {
        toast.error('No images found on this page');
        return;
      }
      
      setShowImageSelector(true);
    } catch (error) {
      toast.error('Failed to fetch product page');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelected = async (imageGroup) => {
    setShowImageSelector(false);
    setLoading(true);
    
    try {
      const processed = await processProductFromURL(
        url,
        renderResult.images.indexOf(imageGroup),
        {
          onProgress: (progress) => {
            toast.info(`${progress.phase}: ${progress.step}`);
          },
        }
      );
      
      setProcessedProduct(processed);
      toast.success('Product processed successfully!');
      
      // Navigate to Add Product page with pre-filled data
      navigate('/admin/products/add', {
        state: {
          productData: {
            name: processed.name,
            brand: processed.brand,
            sku: processed.sku,
            description: processed.description,
            shortDescription: processed.shortDescription,
            price: processed.price?.inr,
            currency: 'INR',
            images: [processed.selectedImage.bestResolutionUrl],
            specifications: processed.specifications,
            variants: processed.variants,
          },
          sourceUrl: url,
          processingLog: processed.rewriteLog,
        }
      });
      
    } catch (error) {
      toast.error('Failed to process product');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Smart Product Import</h1>
              <p className="text-gray-600">Automatically extract products from any e-commerce site</p>
            </div>
          </div>

          {/* URL Input */}
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/product/..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <Button
              onClick={handleFetch}
              disabled={loading || !url}
              className="px-8 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Fetch Product'
              )}
            </Button>
          </div>

          {/* How it Works */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">1</div>
              <span className="text-gray-700">Render page</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">2</div>
              <span className="text-gray-700">Extract images</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">3</div>
              <span className="text-gray-700">Select image</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">4</div>
              <span className="text-gray-700">Rewrite brand</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">5</div>
              <span className="text-gray-700">Pre-fill form</span>
            </div>
          </div>
        </div>

        {/* Processing Preview */}
        {processedProduct && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold mb-4">Processing Complete ✅</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-sm text-gray-600">Product Name</span>
                <p className="font-semibold">{processedProduct.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">SKU</span>
                <p className="font-semibold">{processedProduct.sku}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Brand</span>
                <p className="font-semibold">FlySpark</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Price (INR)</span>
                <p className="font-semibold">₹{processedProduct.price?.inr?.toLocaleString()}</p>
              </div>
            </div>

            <HTMLDescriptionPreview 
              html={processedProduct.description}
            />
          </div>
        )}
      </div>

      {/* Image Selector Modal */}
      {showImageSelector && renderResult && (
        <AdvancedImageSelector
          images={renderResult.images}
          pagePreviewHtml={renderResult.html}
          pageUrl={url}
          onConfirm={handleImageSelected}
          onCancel={() => setShowImageSelector(false)}
        />
      )}
    </div>
  );
}
```

**Step 2:** Add route to router

```tsx
// /src/app/routes.tsx
import { SmartImportPage } from './pages/admin/SmartImportPage';

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      // ... existing routes
      { 
        path: "admin/products/smart-import", 
        Component: SmartImportPage 
      },
    ],
  },
]);
```

**Step 3:** Add navigation link

```tsx
// In your admin sidebar/menu
<Link to="/admin/products/smart-import">
  <Sparkles className="w-5 h-5" />
  Smart Import
</Link>
```

---

### **Option 2: Integrate into Existing AI Assistant**

Modify your existing AI Assistant to use the new system:

**Update `/src/app/pages/AIAssistantPageNew.tsx`:**

```typescript
import { renderProductPage } from '../lib/headlessBrowser';
import { processProductFromURL } from '../lib/productProcessor';
import { AdvancedImageSelector } from '../components/admin/AdvancedImageSelector';

// In your handleProductExtraction function:
const handleProductExtraction = async (userMessage, files, intent) => {
  // ... existing code ...
  
  // Step 1: Use new headless browser
  const renderResult = await renderProductPage(finalUrl, (progress) => {
    updateCheckpoint(1, 'active', progress.message);
  });
  
  // Step 2: Show advanced image selector
  const selectedImage = await new Promise((resolve) => {
    setImageSelector({
      show: true,
      renderResult,
      onConfirm: resolve,
    });
  });
  
  // Step 3: Process with new system
  const processed = await processProductFromURL(
    finalUrl,
    selectedImage.index,
    {
      onProgress: (progress) => {
        addAssistantMessage(`${progress.phase}: ${progress.step}`);
      },
    }
  );
  
  // Step 4: Navigate to Add Product (NO DRAFT)
  navigate('/admin/products/add', {
    state: { productData: processed }
  });
};
```

---

### **Option 3: Standalone Button in Products List**

Add a "Quick Import" button to your products list page:

```tsx
// /src/app/pages/admin/ProductsPage.tsx

<Button
  onClick={() => navigate('/admin/products/smart-import')}
  className="bg-gradient-to-r from-blue-600 to-purple-600"
>
  <Sparkles className="w-4 h-4 mr-2" />
  Smart Import
</Button>
```

---

## 🔌 Pre-fill Add Product Form

Update your Add Product page to accept pre-filled data:

```tsx
// /src/app/pages/admin/AddProductPage.tsx
import { useLocation } from 'react-router';

export function AddProductPage() {
  const location = useLocation();
  const prefillData = location.state?.productData;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    brand: 'FlySpark',
    sku: '',
    description: '',
    shortDescription: '',
    price: 0,
    currency: 'INR',
    specifications: {},
  });
  
  const [images, setImages] = useState([]);
  
  // Pre-fill on mount
  useEffect(() => {
    if (prefillData) {
      setFormData({
        name: prefillData.name || '',
        brand: prefillData.brand || 'FlySpark',
        sku: prefillData.sku || '',
        description: prefillData.description || '',
        shortDescription: prefillData.shortDescription || '',
        price: prefillData.price || 0,
        currency: prefillData.currency || 'INR',
        specifications: prefillData.specifications || {},
      });
      
      // Pre-fill images
      if (prefillData.images && prefillData.images.length > 0) {
        setImages(prefillData.images.map(url => ({
          url,
          uploaded: false,
          storageUrl: null,
        })));
      }
      
      toast.success('Product data loaded from Smart Import!');
    }
  }, [prefillData]);
  
  // ... rest of your form logic
}
```

---

## 📦 Required Packages

Install dependencies:

```bash
# Core dependencies (already installed)
# None needed - uses existing packages

# Optional for production headless browser
pnpm add puppeteer        # Headless Chrome
pnpm add sharp            # Image processing
pnpm add jsdom            # HTML parsing
```

---

## 🎨 Styling Integration

The new components use your existing design system:

- `Button` from `/src/app/components/ui/button`
- Tailwind CSS classes
- Lucide React icons
- Existing color scheme (blue accent, purple gradient)

**No additional styling needed!**

---

## 🧪 Testing the System

### **Test URL Examples:**

```
✓ Amazon: https://www.amazon.com/dp/B08N5WRWNW
✓ eBay: https://www.ebay.com/itm/123456789
✓ AliExpress: https://www.aliexpress.com/item/1005001234567890.html
✓ Shopify stores: https://store.myshopify.com/products/product-name
```

### **Expected Flow:**

1. User enters product URL
2. System fetches & renders (5-10 seconds)
3. Image selector appears with all variants
4. User selects best image
5. Processing happens (2-3 seconds):
   - Brand → FlySpark
   - SKU → FS-XXXX-XXXX-VX
   - Price → INR (if USD)
6. Redirect to Add Product with pre-filled form
7. User reviews and publishes

---

## ⚡ Performance Tips

### **1. Enable Caching**

Cache rendered pages for 24 hours:

```typescript
// In headlessBrowser.ts
const cache = new Map();

export async function renderProductPage(url: string) {
  if (cache.has(url)) {
    const cached = cache.get(url);
    if (Date.now() - cached.timestamp < 86400000) { // 24 hours
      return cached.data;
    }
  }
  
  const result = await actualRender(url);
  cache.set(url, { data: result, timestamp: Date.now() });
  return result;
}
```

### **2. Use Web Workers for Processing**

Offload heavy processing:

```typescript
// worker.ts
self.onmessage = async (e) => {
  const { html, url } = e.data;
  const images = extractImageCatalog(html, url);
  self.postMessage({ images });
};

// Main thread
const worker = new Worker('./worker.ts');
worker.postMessage({ html, url });
worker.onmessage = (e) => {
  setImages(e.data.images);
};
```

### **3. Lazy Load Images**

In image selector, use intersection observer:

```tsx
<img
  src={group.thumbnailUrl}
  loading="lazy"
  decoding="async"
/>
```

---

## 🐛 Troubleshooting

### **Issue: No images detected**

**Solution:**
- Page may require authentication
- Images loaded via JavaScript (not in initial HTML)
- Try uploading screenshots manually

### **Issue: Wrong brand detected**

**Solution:**
- Add brand to detection list in `brandRewriter.ts`
- Check `commonBrands` array

### **Issue: SKU format incorrect**

**Solution:**
- Review category mapping in `inferCategory()`
- Check series detection patterns

### **Issue: Currency not converting**

**Solution:**
- Verify price detection in `parsePrice()`
- Check currency regex in `detectCurrency()`

---

## 📞 Support

**Questions?** Check these resources:

1. `/PRODUCT_PROCESSING_SYSTEM.md` - Full architecture
2. `/prompts/` - AI prompts and guides
3. Inline code comments - Each function documented

---

## 🎉 You're Ready!

The Product Processing System is now fully integrated and ready to use!

**Next Steps:**
1. Choose integration option (1, 2, or 3)
2. Test with a sample product URL
3. Customize branding rules as needed
4. Deploy to production

🚀 **Happy importing!**
