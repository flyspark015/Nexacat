/**
 * Conversational AI Intent Detection and Response Generation
 * Provides natural language understanding for the AI Assistant
 */

export interface DetectedIntent {
  type: 'product_extraction' | 'general_help' | 'settings_inquiry' | 'product_management' | 'unknown';
  confidence: number;
  suggestedAction?: string;
  entities?: {
    url?: string;
    hasImages?: boolean;
    hasPDF?: boolean;
  };
}

/**
 * Detect user intent from message and context
 */
export function detectIntent(
  message: string,
  hasFiles: boolean,
  fileTypes: string[]
): DetectedIntent {
  const lowerMessage = message.toLowerCase().trim();

  // URL detection
  const urlMatch = message.match(/(https?:\/\/[^\s]+)/);
  const hasUrl = !!urlMatch;

  // Check for images/PDFs
  const hasImages = fileTypes.some(type => type.startsWith('image/'));
  const hasPDF = fileTypes.some(type => type.includes('pdf'));

  // Strong intent signals
  const productKeywords = [
    'add product', 'create product', 'extract', 'analyze', 'process',
    'add this', 'create this', 'extract from', 'get product', 'import'
  ];

  const helpKeywords = [
    'help', 'how', 'what can', 'guide', 'tutorial', 'explain',
    'tell me about', 'how do i', 'what is'
  ];

  const settingsKeywords = [
    'settings', 'configure', 'api key', 'model', 'change model',
    'budget', 'cost', 'usage'
  ];

  // Check for product extraction intent
  if (hasUrl || hasImages || hasPDF) {
    return {
      type: 'product_extraction',
      confidence: 0.95,
      suggestedAction: 'extract_product',
      entities: { url: urlMatch?.[0], hasImages, hasPDF },
    };
  }

  // Check for explicit product keywords
  if (productKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return {
      type: 'product_extraction',
      confidence: 0.85,
      suggestedAction: hasFiles ? 'extract_product' : 'request_input',
      entities: { hasImages, hasPDF },
    };
  }

  // Check for help request
  if (helpKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return {
      type: 'general_help',
      confidence: 0.9,
      suggestedAction: 'show_help',
    };
  }

  // Check for settings
  if (settingsKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return {
      type: 'settings_inquiry',
      confidence: 0.8,
      suggestedAction: 'show_settings_info',
    };
  }

  // Default to unknown - be conversational
  return {
    type: 'unknown',
    confidence: 0.3,
    suggestedAction: 'conversational_response',
  };
}

/**
 * Generate conversational response based on intent
 */
export function generateConversationalResponse(
  intent: DetectedIntent,
  userMessage: string,
  context?: {
    hasApiKey?: boolean;
    recentProducts?: number;
  }
): string {
  const { type, suggestedAction, entities } = intent;

  switch (type) {
    case 'product_extraction':
      if (suggestedAction === 'request_input') {
        return `I'd be happy to help you add that product! 

Could you provide:
• A product URL I can analyze, or
• Upload some product images, or
• Attach a PDF catalog

Just paste, upload, or drag & drop and I'll extract all the details automatically.`;
      }
      return ''; // Will be handled by extraction flow

    case 'general_help':
      return `Hi! I'm your AI Product Assistant, and I'm here to make adding products effortless.

**What I can do:**
• **Extract from URLs** - Just paste any product page link
• **Analyze images** - Upload or paste product photos
• **Parse PDFs** - Attach catalogs or spec sheets
• **Auto-generate descriptions** - Professional, B2B-ready content
• **Suggest categories** - Smart categorization
• **Optimize images** - Automatic processing

**How to use me:**
Just naturally describe what you want, or paste a URL/upload files. I'll figure out the rest!

Examples:
- "Add this product: https://..." 
- *uploads 3 product images*
- "Extract products from this catalog" *attaches PDF*

${context?.recentProducts ? `\n💡 You've already processed ${context.recentProducts} products this month. Keep going!` : ''}

What would you like to do?`;

    case 'settings_inquiry':
      return `To adjust my settings, head to **Admin → Settings** in the menu, then scroll to the **AI Product Assistant** section.

There you can:
• Change the AI model (currently using the strongest available)
• Set budget alerts
• Add custom instructions
• View usage statistics

${!context?.hasApiKey ? '\n⚠️ **Note:** You need to add your OpenAI API key first in Settings.' : ''}`;

    case 'product_management':
      return `I can help with products! What would you like to do?

• **Add a new product** - Share a URL, image, or PDF
• **Update existing products** - Tell me which product and what to change
• **Manage categories** - I can suggest or create categories

Just let me know what you need!`;

    case 'unknown':
    default:
      // Be conversational and helpful
      if (userMessage.length < 5) {
        return `I'm here when you're ready! Feel free to:
• Paste a product URL
• Upload product images
• Or just ask me anything`;
      }

      return `I understand you said: "${userMessage}"

I'm optimized for adding products quickly. If you have a product to add, just:
• Paste the URL, or
• Upload images/PDFs

Otherwise, ask me "help" for more info, or describe what you need and I'll assist!`;
  }
}

/**
 * Generate contextual welcome message
 */
export function generateWelcomeMessage(context?: {
  firstName?: string;
  recentProducts?: number;
  hasApiKey?: boolean;
}): string {
  const greeting = context?.firstName ? `Hi ${context.firstName}!` : 'Welcome!';
  
  let message = `${greeting} I'm your AI Product Assistant.

I can automatically extract product data from:
• 🔗 URLs (just paste any product link)
• 📸 Images (upload or paste screenshots)
• 📄 PDFs (catalogs and spec sheets)

**Just paste, upload, or describe what you need** - I'll handle the rest.`;

  if (!context?.hasApiKey) {
    message += `\n\n⚠️ **Setup Required:** Add your OpenAI API key in Settings → AI Product Assistant to get started.`;
  } else if (context?.recentProducts) {
    message += `\n\n📊 You've processed ${context.recentProducts} products this month. Great work!`;
  }

  return message;
}

/**
 * Extract URL from message
 */
export function extractUrlFromMessage(message: string): string | null {
  const urlMatch = message.match(/(https?:\/\/[^\s]+)/);
  return urlMatch ? urlMatch[0] : null;
}
