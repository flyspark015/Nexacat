/**
 * OpenAI Client for Product Data Extraction
 * 
 * PRODUCTION NOTE: This client-side implementation is suitable for admin-only features.
 * For public-facing features, migrate to Firebase Cloud Functions.
 */

export interface ProductExtractionResult {
  title: string;
  description: string;
  shortDescription: string[];
  specifications: Record<string, string>;
  tags: string[];
  imageUrls: string[];
  videoUrl?: string;
  stockStatus: 'in-stock' | 'out-of-stock' | 'preorder';
  suggestedCategory: string;
  confidence: number;
  warnings: string[];
  tokensUsed: number;
  cost: number;
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
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    if (!apiKey || !apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key');
    }
    this.apiKey = apiKey;
  }

  /**
   * Extract product data from URL or images
   */
  async extractProductData(options: ExtractionOptions): Promise<ProductExtractionResult> {
    const {
      url,
      imageUrls = [],
      additionalText = '',
      customInstructions = [],
      model = 'gpt-4-vision-preview',
      maxTokens = 4000,
    } = options;

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
    if (imageUrls.length > 0 && model.includes('vision')) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt,
          },
          ...imageUrls.slice(0, 4).map(url => ({
            type: 'image_url',
            image_url: {
              url,
              detail: 'high',
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
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
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
        model,
        data.usage?.prompt_tokens || 0,
        data.usage?.completion_tokens || 0
      );

      return {
        title: parsed.title || 'Untitled Product',
        description: parsed.description || '',
        shortDescription: parsed.shortDescription || parsed.features || [],
        specifications: parsed.specifications || {},
        tags: parsed.tags || [],
        imageUrls: parsed.imageUrls || [],
        videoUrl: parsed.videoUrl || undefined,
        stockStatus: parsed.stockStatus || 'in-stock',
        suggestedCategory: parsed.suggestedCategory || 'General',
        confidence: parsed.confidence || 0.5,
        warnings: parsed.warnings || [],
        tokensUsed,
        cost,
      };
    } catch (error: any) {
      console.error('OpenAI extraction error:', error);
      throw new Error(`AI extraction failed: ${error.message}`);
    }
  }

  /**
   * Build system prompt with custom instructions
   */
  private buildSystemPrompt(customInstructions: string[]): string {
    let prompt = `You are an expert e-commerce product data extraction specialist for B2B catalogs. Your task is to analyze product information and extract structured data.

CRITICAL RULES:
1. Extract only factual information from the source
2. Do NOT hallucinate or invent data
3. If information is unclear, mark it in warnings
4. Use professional B2B language
5. Format specifications consistently
6. Provide category suggestions with confidence scores
7. Extract all visible product images
8. Return ONLY valid JSON

OUTPUT FORMAT:
{
  "title": "Exact product name/title",
  "description": "Detailed HTML description with <p>, <ul>, <li>, <strong> tags",
  "shortDescription": ["Key feature 1", "Key feature 2", "Key feature 3"],
  "specifications": {
    "Brand": "Value",
    "Model": "Value",
    "Power": "Value with units"
  },
  "tags": ["tag1", "tag2", "tag3"],
  "imageUrls": ["url1", "url2"],
  "videoUrl": "youtube_url or null",
  "stockStatus": "in-stock",
  "suggestedCategory": "Electronics > LED Lights",
  "confidence": 0.85,
  "warnings": ["Any data quality issues or missing information"]
}`;

    if (customInstructions.length > 0) {
      prompt += `\n\nCUSTOM INSTRUCTIONS (High Priority):\n`;
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
    // Pricing per 1M tokens (as of 2025)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4-vision-preview': { input: 10, output: 30 },
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
      const response = await fetch(`${this.baseUrl}/models`, {
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
