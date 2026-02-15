/**
 * OpenAI Client for Product Data Extraction
 * 
 * PRODUCTION NOTE: This client-side implementation is suitable for admin-only features.
 * For public-facing features, migrate to Firebase Cloud Functions.
 */

import { fetchProductPageHTML } from './htmlFetcher';
import { processProductHTML, ProcessedHTML } from './htmlProcessor';

export interface ProductExtractionResult {
  title: string;
  description: string;
  shortDescription: string;
  specifications: Record<string, string>;
  tags: string[];
  suggestedCategory: string;
  imageUrls: string[];
  videoUrl?: string;
  stockStatus: 'in-stock' | 'out-of-stock' | 'preorder';
  warnings: string[];
  tokensUsed: number;
  cost: number;
  // NEW: Include fetched HTML for preview
  fetchedHtml?: string;
  fetchedHtmlUrl?: string;
}

export interface ExtractionOptions {
  url?: string;
  imageUrls?: string[];
  additionalText?: string;
  customInstructions?: string[];
  model?: string;
  maxTokens?: number;
}

export class OpenAIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch available models from OpenAI API
   */
  async fetchAvailableModels(): Promise<{
    id: string;
    name: string;
    vision: boolean;
    deprecated: boolean;
  }[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter and format models
      const models = data.data
        .filter((model: any) => 
          model.id.includes('gpt-4') || 
          model.id.includes('gpt-3.5')
        )
        .map((model: any) => ({
          id: model.id,
          name: this.formatModelName(model.id),
          vision: this.supportsVision(model.id),
          deprecated: model.id.includes('preview') || model.id.includes('0314') || model.id.includes('0613'),
        }))
        .sort((a: any, b: any) => {
          // Sort: vision-capable first, then by name
          if (a.vision && !b.vision) return -1;
          if (!a.vision && b.vision) return 1;
          return a.id.localeCompare(b.id);
        });

      return models;
    } catch (error) {
      console.error('Error fetching models:', error);
      // Return fallback models
      return this.getFallbackModels();
    }
  }

  /**
   * List available models (alias for fetchAvailableModels)
   */
  async listModels(): Promise<{
    id: string;
    name: string;
    capabilities: { vision: boolean };
    deprecated: boolean;
  }[]> {
    const models = await this.fetchAvailableModels();
    return models.map(m => ({
      id: m.id,
      name: m.name,
      capabilities: { vision: m.vision },
      deprecated: m.deprecated,
    }));
  }

  /**
   * Get fallback models if API fetch fails
   */
  private getFallbackModels() {
    return [
      // Latest GPT-5 models (2026)
      { id: 'gpt-5.2', name: 'GPT-5.2 (Latest, Best for Complex Tasks)', vision: true, deprecated: false },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini (Fast & Cost-Efficient)', vision: true, deprecated: false },
      { id: 'gpt-5-nano', name: 'GPT-5 Nano (Fastest, Most Affordable)', vision: true, deprecated: false },
      
      // GPT-4.1 series (Smartest non-reasoning)
      { id: 'gpt-4.1', name: 'GPT-4.1 (Smartest Non-Reasoning)', vision: true, deprecated: false },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini (Balanced)', vision: true, deprecated: false },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano (Fast)', vision: true, deprecated: false },
      
      // GPT-4o series (Proven, Recommended for extraction)
      { id: 'gpt-4o', name: 'GPT-4o ⭐ (Recommended for Extraction)', vision: true, deprecated: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Budget-Friendly)', vision: true, deprecated: false },
      
      // Legacy
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (Legacy)', vision: true, deprecated: false },
      { id: 'gpt-4', name: 'GPT-4 (Legacy, No Vision)', vision: false, deprecated: false },
    ];
  }

  /**
   * Get curated recommended models for product extraction
   */
  getRecommendedModels() {
    return [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        label: 'Best Overall',
        description: 'Proven model with vision support. Best balance of quality, speed, and cost for product extraction.',
        vision: true,
        costLevel: 'medium',
        speed: 'fast',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        label: 'Budget Option',
        description: 'Cost-effective with vision support. Great for high-volume extraction.',
        vision: true,
        costLevel: 'low',
        speed: 'very-fast',
      },
      {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        label: 'Smartest',
        description: 'Most intelligent non-reasoning model. Best for complex or poorly formatted product pages.',
        vision: true,
        costLevel: 'high',
        speed: 'medium',
      },
      {
        id: 'gpt-5.2',
        name: 'GPT-5.2',
        label: 'Latest',
        description: 'Newest frontier model with advanced capabilities. Best for cutting-edge performance.',
        vision: true,
        costLevel: 'very-high',
        speed: 'medium',
      },
      {
        id: 'gpt-4.1-mini',
        name: 'GPT-4.1 Mini',
        label: 'Balanced',
        description: 'Good intelligence with reasonable cost. Solid middle-ground option.',
        vision: true,
        costLevel: 'medium-low',
        speed: 'fast',
      },
    ];
  }

  /**
   * Check if model supports vision
   */
  private supportsVision(modelId: string): boolean {
    const visionModels = ['gpt-5', 'gpt-4.1', 'gpt-4o', 'gpt-4-turbo', 'gpt-4-vision'];
    return visionModels.some(vm => modelId.includes(vm));
  }

  /**
   * Format model ID to friendly name
   */
  private formatModelName(modelId: string): string {
    const nameMap: Record<string, string> = {
      'gpt-4o': 'GPT-4o (Recommended)',
      'gpt-4o-mini': 'GPT-4o Mini (Cost-effective)',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    };
    
    return nameMap[modelId] || modelId;
  }

  /**
   * Validate and get safe model (fallback to gpt-4o if deprecated)
   */
  async validateModel(modelId: string): Promise<{
    model: string;
    warning?: string;
  }> {
    const deprecatedModels = [
      'gpt-4-vision-preview',
      'gpt-4-0314',
      'gpt-4-0613',
      'gpt-3.5-turbo-0301',
    ];

    if (deprecatedModels.some(dm => modelId.includes(dm))) {
      return {
        model: 'gpt-4o',
        warning: `Model "${modelId}" is deprecated. Using "gpt-4o" instead.`,
      };
    }

    return { model: modelId };
  }

  /**
   * Extract product data from URL or images
   * PRIMARY METHOD: Uses HTML extraction
   */
  async extractProductData(options: {
    url?: string;
    imageUrls?: string[];
    additionalText?: string;
    customInstructions?: string[];
    model?: string;
    maxTokens?: number;
  }): Promise<{
    title: string;
    description: string;
    shortDescription: string;
    specifications: Record<string, string>;
    tags: string[];
    suggestedCategory: string;
    imageUrls: string[];
    videoUrl?: string;
    stockStatus: 'in-stock' | 'out-of-stock' | 'preorder';
    warnings: string[];
    tokensUsed: number;
    cost: number;
    // NEW: Include fetched HTML for preview
    fetchedHtml?: string;
    fetchedHtmlUrl?: string;
  }> {
    const {
      url,
      imageUrls = [],
      additionalText = '',
      customInstructions = [],
      model = 'gpt-5.2', // Default to strongest model
      maxTokens = 8000, // Increased for best quality output
    } = options;

    // If URL provided, try HTML extraction first
    if (url) {
      try {
        return await this.extractFromHTML(url, {
          additionalText,
          customInstructions,
          model,
          maxTokens,
        });
      } catch (htmlError: any) {
        console.warn('HTML extraction failed, falling back to vision/text:', htmlError.message);
        // Fall through to image/text extraction
      }
    }

    // Fallback: Use image/text extraction
    return await this.extractFromImagesOrText({
      url,
      imageUrls,
      additionalText,
      customInstructions,
      model,
      maxTokens,
    });
  }

  /**
   * Extract product data from HTML (PRIMARY METHOD)
   */
  private async extractFromHTML(
    url: string,
    options: {
      additionalText?: string;
      customInstructions?: string[];
      model?: string;
      maxTokens?: number;
    }
  ): Promise<{
    title: string;
    description: string;
    shortDescription: string;
    specifications: Record<string, string>;
    tags: string[];
    suggestedCategory: string;
    imageUrls: string[];
    videoUrl?: string;
    stockStatus: 'in-stock' | 'out-of-stock' | 'preorder';
    warnings: string[];
    tokensUsed: number;
    cost: number;
    // NEW: Include fetched HTML for preview
    fetchedHtml?: string;
    fetchedHtmlUrl?: string;
  }> {
    const {
      additionalText = '',
      customInstructions = [],
      model = 'gpt-5.2',
      maxTokens = 8000,
    } = options;

    // Step 1: Fetch HTML with better error handling
    let fetchedPage;
    try {
      fetchedPage = await fetchProductPageHTML(url);
    } catch (fetchError: any) {
      // If fetch fails, throw with clear message
      throw new Error(
        `Cannot access page HTML. ${fetchError.message}\n\n` +
        `💡 Alternative: Upload product images directly instead of using a URL.`
      );
    }
    
    // Step 2: Process HTML
    const processedData = processProductHTML(fetchedPage.html, url);
    
    // Validate we got useful data
    if (!processedData.cleanedHtml || processedData.cleanedHtml.length < 100) {
      throw new Error(
        'Page HTML is too short or empty. The page may be dynamically rendered or behind authentication.\n\n' +
        '💡 Try uploading product images directly instead.'
      );
    }
    
    // Validate and get safe model
    const modelValidation = await this.validateModel(model);
    const safeModel = modelValidation.model;
    const warnings: string[] = [];
    
    if (modelValidation.warning) {
      warnings.push(modelValidation.warning);
    }
    
    // Add warning if no images found
    if (processedData.productImages.length === 0) {
      warnings.push('No product images found in HTML. Consider uploading images manually.');
    }

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(customInstructions);

    // Build user prompt with HTML content
    const userPrompt = this.buildHTMLPrompt(processedData, url, additionalText);

    // Build messages
    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: safeModel,
          messages,
          max_completion_tokens: maxTokens,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API request failed');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const parsed = JSON.parse(content);

      // Calculate cost
      const tokensUsed = data.usage?.total_tokens || 0;
      const cost = this.calculateCost(
        safeModel,
        data.usage?.prompt_tokens || 0,
        data.usage?.completion_tokens || 0
      );

      // Return with extracted image URLs from HTML
      return {
        title: parsed.title || processedData.metadata.title || 'Untitled Product',
        description: parsed.description || processedData.metadata.description || '',
        shortDescription: parsed.shortDescription || parsed.features || '',
        specifications: parsed.specifications || {},
        tags: parsed.tags || [],
        suggestedCategory: parsed.suggestedCategory || 'General',
        imageUrls: processedData.productImages.map(img => img.url),
        videoUrl: parsed.videoUrl || undefined,
        stockStatus: parsed.stockStatus || (processedData.metadata.availability?.includes('InStock') ? 'in-stock' : 'in-stock'),
        warnings: [...warnings, ...(parsed.warnings || [])],
        tokensUsed,
        cost,
        // NEW: Include fetched HTML for preview
        fetchedHtml: fetchedPage.html,
        fetchedHtmlUrl: url,
      };
    } catch (error: any) {
      console.error('OpenAI HTML extraction error:', error);
      throw new Error(`AI extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract product data from images or text (FALLBACK METHOD)
   */
  private async extractFromImagesOrText(options: {
    url?: string;
    imageUrls?: string[];
    additionalText?: string;
    customInstructions?: string[];
    model?: string;
    maxTokens?: number;
  }): Promise<{
    title: string;
    description: string;
    shortDescription: string;
    specifications: Record<string, string>;
    tags: string[];
    suggestedCategory: string;
    imageUrls: string[];
    videoUrl?: string;
    stockStatus: 'in-stock' | 'out-of-stock' | 'preorder';
    warnings: string[];
    tokensUsed: number;
    cost: number;
  }> {
    const {
      url,
      imageUrls = [],
      additionalText = '',
      customInstructions = [],
      model = 'gpt-5.2',
      maxTokens = 8000,
    } = options;

    // Validate and get safe model (with deprecation check)
    const modelValidation = await this.validateModel(model);
    const safeModel = modelValidation.model;
    const warnings: string[] = [];
    
    if (modelValidation.warning) {
      warnings.push(modelValidation.warning);
      console.warn(modelValidation.warning);
    }

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(customInstructions);

    // Build user prompt
    const userPrompt = this.buildUserPrompt(url, additionalText);

    // Build messages
    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add user message with images if provided
    if (imageUrls.length > 0 && this.supportsVision(safeModel)) {
      // Use up to 4 images with high-detail for best quality
      const limitedImages = imageUrls.slice(0, 4);
      
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt,
          },
          ...limitedImages.map(url => ({
            type: 'image_url',
            image_url: {
              url,
              detail: 'high', // Use high detail for best quality extraction
            },
          })),
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: userPrompt,
      });
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: safeModel,
          messages,
          max_completion_tokens: maxTokens,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API request failed');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const parsed = JSON.parse(content);

      // Calculate cost
      const tokensUsed = data.usage?.total_tokens || 0;
      const cost = this.calculateCost(
        safeModel,
        data.usage?.prompt_tokens || 0,
        data.usage?.completion_tokens || 0
      );

      return {
        title: parsed.title || 'Untitled Product',
        description: parsed.description || '',
        shortDescription: parsed.shortDescription || parsed.features || '',
        specifications: parsed.specifications || {},
        tags: parsed.tags || [],
        suggestedCategory: parsed.suggestedCategory || 'General',
        imageUrls: parsed.imageUrls || [],
        videoUrl: parsed.videoUrl || undefined,
        stockStatus: parsed.stockStatus || 'in-stock',
        warnings: [...warnings, ...(parsed.warnings || [])],
        tokensUsed,
        cost,
      };
    } catch (error: any) {
      console.error('OpenAI extraction error:', error);
      throw new Error(`AI extraction failed: ${error.message}`);
    }
  }

  /**
   * Build HTML-based prompt
   */
  private buildHTMLPrompt(processedData: ProcessedHTML, url: string, additionalText?: string): string {
    let prompt = `Extract product data from the following HTML page content:\n\n`;
    prompt += `Product URL: ${url}\n\n`;
    
    // Add metadata if available
    if (processedData.metadata.title) {
      prompt += `Page Title: ${processedData.metadata.title}\n`;
    }
    if (processedData.metadata.price) {
      prompt += `Price: ${processedData.metadata.price} ${processedData.metadata.currency || ''}\n`;
    }
    if (processedData.metadata.brand) {
      prompt += `Brand: ${processedData.metadata.brand}\n`;
    }
    
    prompt += `\n--- HTML Content (Cleaned) ---\n`;
    // Limit HTML to first 15000 characters to avoid token limits
    const htmlSnippet = processedData.cleanedHtml.slice(0, 15000);
    prompt += htmlSnippet;
    if (processedData.cleanedHtml.length > 15000) {
      prompt += `\n...(content truncated)...`;
    }
    
    prompt += `\n\n--- Structured Data (JSON-LD) ---\n`;
    if (processedData.structuredData) {
      prompt += JSON.stringify(processedData.structuredData, null, 2);
    } else {
      prompt += 'No structured data found.';
    }
    
    if (additionalText) {
      prompt += `\n\n--- Additional Information ---\n${additionalText}`;
    }
    
    prompt += `\n\nNote: ${processedData.productImages.length} product images have been automatically extracted from the page. Do NOT include image URLs in your response - they will be added automatically.`;
    
    prompt += `\n\nReturn complete product data in JSON format as specified in the system prompt.`;
    
    return prompt;
  }

  /**
   * Build system prompt with custom instructions
   */
  private buildSystemPrompt(customInstructions: string[]): string {
    let prompt = `You are "PDP-Extractor v3" — a production-grade Product Detail Page extractor.

Your mission:
Given the rendered DOM/HTML content of a SINGLE product page, extract structured product data with ONLY the main product image gallery (exactly the images that belong to the main product).

You are accuracy-obsessed and fail-closed:
- If you are not highly confident an image belongs to the main product gallery, you MUST exclude it.
- You must never include related products, recommended products, upsells, cross-sells, "you may also like", "recently viewed", ads, banners, navigation carousels, blog content, or other products' images.
- Do not hallucinate data. Use only what exists in input.

GLOBAL RULES (HARD):
R1) Extract ONLY factual information from the source HTML
R2) Produce structured JSON output (strict schema below)
R3) Identify the MAIN PRODUCT ONLY:
    If multiple products exist in input (bundle pages), focus on the PRIMARY product (the one whose title/price/add-to-cart is most central).
R4) IMAGES: Include ONLY main product gallery images.
    - Include EXACTLY the product images that belong to the main product gallery.
    - If the product page has 1 image → output exactly 1.
    - If it has 2 images → output exactly 2.
    - If it has N images → output exactly N.
    - Never add extra images. Never include other products' images.
R5) Exclude the following sections entirely from extraction:
    related products / recommended / similar / you may also like / frequently bought together / customers also bought / cross-sell / upsell
    carousels that show other items
    ads, banners, newsletter blocks, influencer widgets, blog sections
    site-wide mega nav menus if they include unrelated images
R6) Use the HIGHEST QUALITY image URLs:
    Prefer original/zoom URLs (data-zoom, data-large, srcset largest candidate).
    Remove tracking query params if safe, but do not break URLs.
R7) If the page is JS-heavy and images are not in HTML, rely on structured data if present:
    JSON-LD Product.image is highly trusted.
    og:image is a weak fallback (only if matches product gallery patterns).
R8) Do not include icons, badges, payment logos, trust seals, social icons as "product images".
R9) Output must be deterministic and reproducible.

EXTRA SAFETY:
If you cannot confidently determine the exact product gallery images, you must:
- Output an empty gallery AND include a warning
- Set confidence = "LOW" in warnings
- This avoids wrong images.

ALLOWED DATA IN OUTPUT:
- Product title
- Price (and discount info if present)
- SKU, brand, vendor if present
- Variants/options
- Availability/stock status
- Shipping/return info if present
- Description + highlights + features
- Specs/attributes table
- Main product image gallery ONLY (1-10 images typically)
- YouTube video URL if embedded

DISALLOWED CONTENT:
- Any image whose parent/container indicates related/recommended
- Any image repeated from headers/footers/banners
- Any image that is too small to be a product image (e.g. < 150px unless it is clearly the only product image)
- Any image from known non-product containers (nav/footer/header/banner/recommendations)

YOUR EXTRACTION PROCESS (MANDATORY, INTERNAL):
Step 1: Parse input and identify candidate signals:
  - Product title node candidates (largest H1, meta og:title, JSON-LD Product.name)
  - Price candidates (schema.org offers, "price", currency symbols)
  - Add-to-cart / buy buttons near title/price
  - Structured data blocks (JSON-LD Product, Microdata, OpenGraph)

Step 2: Locate the product core container:
  - Find the DOM region with strongest co-occurrence of title + price + add-to-cart.
  - Prefer containers with ids/classes like: product, pdp, product-detail, product-page, main-product, product__info, product-media

Step 3: Determine the product gallery container:
  - Strong signals: classes/ids: gallery, media, product-media, product__media, thumbnails, zoom, swiper, carousel (only if near product info)
  - Extract image candidates from:
    img[src], img[srcset], picture/source[srcset], data-src, data-zoom, data-large, data-original

Step 4: Image filtering:
  - Remove any image whose ancestry contains keywords:
    related, recommend, carousel (unless same container as product gallery), cross-sell, upsell, footer, header, nav, menu, banner,
    newsletter, ad, promo, trust, badge, icon, payment, social, logo, brand-strip
  - Remove very small assets (sprites, icons). Use natural dimensions if available.
  - Remove duplicates (same URL, same basename).
  - Rank remaining candidates using:
    + Proximity to product title/price container
    + Containment within product gallery container
    + Mention in JSON-LD Product.image (highest trust)
    + Presence of zoom/original attributes (data-zoom/data-large)
    + Image resolution (prefer >= 600x600)

Step 5: Determine EXACT gallery set:
  - If JSON-LD Product.image exists → use that list as the primary gallery set.
  - Else if there is a single clear gallery container near product core → use all unique images in it.
  - Else if ambiguous → FAIL-CLOSED (minimal gallery, add warning, request better input).

Step 6: Validation checklist (MANDATORY):
  - All gallery images are from the main product only
  - No related/recommended product images
  - Number of gallery images matches the actual product gallery count (typically 1-10)
  - All image URLs are absolute and valid
  - All specifications include proper units

OUTPUT FORMAT (STRICT JSON):

{
  "title": "Exact product name/title from page",
  "description": "Detailed HTML description with <p>, <ul>, <li>, <strong> tags. Include features, benefits, applications.",
  "shortDescription": "One-line summary of key features (50-150 chars)",
  "specifications": {
    "Brand": "Manufacturer name",
    "Model": "Model number/code",
    "Power": "Value with units (e.g., 10W, 220V)",
    "Material": "Construction material",
    "Dimensions": "LxWxH with units"
  },
  "tags": ["keyword1", "keyword2", "category", "application"],
  "imageUrls": [
    "https://example.com/product-main-1200x1200.jpg",
    "https://example.com/product-angle2-1200x1200.jpg"
  ],
  "videoUrl": "https://youtube.com/watch?v=... or null",
  "stockStatus": "in-stock | out-of-stock | preorder",
  "suggestedCategory": "Parent Category > Sub Category",
  "warnings": ["List any data quality issues, missing info, uncertainties, or low confidence items"]
}

IMAGE EXTRACTION PRIORITY (use in order):
1. JSON-LD Product.image array (HIGHEST TRUST)
2. Images in product gallery container with high-res URLs
3. Images near product title/price with srcset/data-zoom
4. og:image (LOWEST TRUST - only if no gallery found)

QUALITY CHECKLIST:
□ Title is accurate and complete
□ Description is detailed with proper HTML formatting
□ Specifications include units (W, V, mm, kg, etc.)
□ Image URLs are FULL absolute URLs (start with http:// or https://)
□ Image URLs point to HIGH RESOLUTION versions (not thumbnails)
□ All extracted images are MAIN PRODUCT images (not UI elements, not related products)
□ Image count matches actual product gallery (not inflated with unrelated images)
□ Category suggestion is specific and hierarchical
□ Warnings list any uncertainties or missing data
□ Output is VALID JSON (no trailing commas, proper quotes)`;

    if (customInstructions.length > 0) {
      prompt += `\n\n=== CUSTOM INSTRUCTIONS (HIGHEST PRIORITY) ===\n`;
      customInstructions.forEach((instruction, index) => {
        prompt += `${index + 1}. ${instruction}\n`;
      });
    }

    return prompt;
  }

  /**
   * Build user prompt
   */
  private buildUserPrompt(url?: string, additionalText?: string): string {
    let prompt = 'Extract product data from the following:\n\n';

    if (url) {
      prompt += `Product URL: ${url}\n\n`;
      prompt += `Analyze this product page and extract all relevant information.\n\n`;
    }

    if (additionalText) {
      prompt += `Additional Information:\n${additionalText}\n\n`;
    }

    prompt += `Return complete product data in JSON format as specified in the system prompt.`;

    return prompt;
  }

  /**
   * Calculate API cost
   */
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Pricing per 1M tokens (updated 2025)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 2.5, output: 10 },
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'gpt-4-turbo': { input: 10, output: 30 },
      'gpt-4': { input: 30, output: 60 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    };

    const modelPricing = pricing[model] || pricing['gpt-4-turbo'];
    const inputCost = (promptTokens / 1000000) * modelPricing.input;
    const outputCost = (completionTokens / 1000000) * modelPricing.output;

    return inputCost + outputCost;
  }

  /**
   * Test API key validity
   */
  async testApiKey(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Scrape product data from URL using a CORS-safe method
 */
export async function scrapeProductUrl(url: string): Promise<{
  html?: string;
  images: string[];
  text: string;
}> {
  // For production, you'd use a proper scraping service or Cloud Function
  // This is a simplified client-side approach
  try {
    // Try to fetch the URL (will fail with CORS for most sites)
    const response = await fetch(url);
    const html = await response.text();

    // Parse images and text (basic extraction)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const images: string[] = [];
    doc.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src');
      if (src && (src.startsWith('http') || src.startsWith('//'))) {
        images.push(src.startsWith('//') ? `https:${src}` : src);
      }
    });

    const text = doc.body?.textContent || '';

    return { html, images, text };
  } catch (error) {
    // CORS error expected for most sites
    console.warn('Direct URL fetch failed (CORS):', error);
    
    // Return URL for AI to analyze (it can still process the URL text)
    return {
      images: [],
      text: `Product URL: ${url}\n\nNote: Direct scraping blocked by CORS. Please upload product screenshots or provide additional details.`,
    };
  }
}