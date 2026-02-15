/**
 * Page Renderer - Production-grade HTML fetching with CORS proxy support
 */

export interface RenderedPage {
  html: string;
  screenshot?: string;
  finalUrl: string;
  statusCode: number;
  metadata: {
    title?: string;
    description?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
  renderTime: number;
}

export interface RenderProgress {
  status: 'fetching' | 'rendering' | 'extracting' | 'complete' | 'error';
  message: string;
  percentage: number;
}

/**
 * Render product page - Fetches HTML via CORS proxies
 */
export async function renderProductPage(
  url: string,
  onProgress?: (progress: RenderProgress) => void
): Promise<RenderedPage> {
  const startTime = Date.now();
  
  onProgress?.({
    status: 'fetching',
    message: 'Fetching page content...',
    percentage: 10,
  });
  
  // Try multiple proxy services in order
  const proxies = [
    {
      name: 'AllOrigins',
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    },
    {
      name: 'CORSProxy',
      url: `https://corsproxy.io/?${encodeURIComponent(url)}`,
    },
    {
      name: 'Direct',
      url: url,
    },
  ];
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < proxies.length; i++) {
    const proxy = proxies[i];
    
    onProgress?.({
      status: 'fetching',
      message: `Trying ${proxy.name}...`,
      percentage: 20 + (i * 25),
    });
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(proxy.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      if (!html || html.length < 100) {
        throw new Error('Invalid HTML response');
      }
      
      onProgress?.({
        status: 'extracting',
        message: 'Processing HTML...',
        percentage: 80,
      });
      
      const metadata = extractMetadataFromHTML(html);
      const renderTime = Date.now() - startTime;
      
      onProgress?.({
        status: 'complete',
        message: `Fetched via ${proxy.name}`,
        percentage: 100,
      });
      
      return {
        html,
        finalUrl: url,
        statusCode: 200,
        metadata,
        renderTime,
      };
    } catch (error: any) {
      const errorMsg = error.name === 'AbortError' ? 'Timeout' : error.message;
      // Silent fail - try next proxy
      lastError = error;
      continue;
    }
  }
  
  // All proxies failed
  throw new Error(`Failed to fetch page: ${lastError?.message || 'All proxies failed'}`);
}

/**
 * Extract metadata from HTML string
 */
function extractMetadataFromHTML(html: string): RenderedPage['metadata'] {
  const metadata: RenderedPage['metadata'] = {};
  
  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }
  
  // Description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) {
    metadata.description = descMatch[1].trim();
  }
  
  // OG Image
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    metadata.ogImage = ogImageMatch[1].trim();
  }
  
  // Canonical
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (canonicalMatch) {
    metadata.canonicalUrl = canonicalMatch[1].trim();
  }
  
  return metadata;
}