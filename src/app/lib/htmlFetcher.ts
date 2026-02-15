/**
 * HTML Fetcher - Server-side HTML fetching with full page rendering
 * Supports both static and client-side rendered content
 */

export interface FetchedPage {
  html: string;
  finalUrl: string;
  statusCode: number;
  contentType: string;
  metadata?: {
    title?: string;
    description?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
}

// Multiple CORS proxy options for fallback
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.org/?${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
];

/**
 * Fetch product page HTML with full rendering support
 * This uses a CORS proxy for client-side fetching
 * In production, this should be replaced with a server-side function
 */
export async function fetchProductPageHTML(url: string): Promise<FetchedPage> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    
    // Try each CORS proxy in sequence (silently)
    let lastError: Error | null = null;
    
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxyFn = CORS_PROXIES[i];
      const proxyUrl = proxyFn(url);
      
      try {
        // Silent attempt - no console logs for individual proxy attempts
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(15000), // 15 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        
        // Validate we got HTML (not JSON error or empty response)
        if (!html || html.trim().length < 100) {
          throw new Error('Empty or invalid response');
        }
        
        // Parse basic metadata from HTML
        const metadata = extractBasicMetadata(html);

        // Success - log only this
        console.log(`✅ Page fetched successfully (${(html.length / 1024).toFixed(1)} KB)`);

        return {
          html,
          finalUrl: url,
          statusCode: response.status,
          contentType: response.headers.get('content-type') || 'text/html',
          metadata,
        };
      } catch (error: any) {
        // Silently record error and continue to next proxy
        lastError = error;
        // No console warnings - completely silent fallback
      }
    }
    
    // All proxies failed, try direct fetch (may fail due to CORS)
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (compatible; FlySpark/1.0)',
        },
        signal: AbortSignal.timeout(10000),
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const metadata = extractBasicMetadata(html);

      console.log('✅ Page fetched successfully (direct)');

      return {
        html,
        finalUrl: url,
        statusCode: response.status,
        contentType: response.headers.get('content-type') || 'text/html',
        metadata,
      };
    } catch (directError: any) {
      // All methods failed - provide helpful user guidance
      throw new Error(
        `Unable to access this product page. This can happen when:\n\n` +
        `• The website blocks automated access\n` +
        `• The page requires authentication\n` +
        `• CORS restrictions prevent browser access\n\n` +
        `💡 Alternative approach:\n` +
        `1. Upload product images directly (recommended)\n` +
        `2. Copy and paste product details into the text field\n` +
        `3. Try a different product URL from the same website`
      );
    }
  } catch (error: any) {
    // Top-level errors (invalid URL, etc.)
    if (error.message.includes('Invalid URL')) {
      throw new Error('Please enter a valid product URL (must start with http:// or https://)');
    }
    throw error;
  }
}

/**
 * Extract basic metadata from HTML for quick validation
 */
function extractBasicMetadata(html: string): FetchedPage['metadata'] {
  const metadata: FetchedPage['metadata'] = {};

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) {
    metadata.description = descMatch[1].trim();
  }

  // Extract Open Graph image
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    metadata.ogImage = ogImageMatch[1].trim();
  }

  // Extract canonical URL
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (canonicalMatch) {
    metadata.canonicalUrl = canonicalMatch[1].trim();
  }

  return metadata;
}

/**
 * Fallback: Fetch HTML using direct method (no proxy)
 * This may fail due to CORS in browser environment
 */
export async function fetchDirectHTML(url: string): Promise<string> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'text/html',
      'User-Agent': 'Mozilla/5.0 (compatible; FlySpark/1.0; +https://flyspark.com)',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.text();
}
