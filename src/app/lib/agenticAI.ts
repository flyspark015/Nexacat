/**
 * Agentic AI System for Conversational Product Management
 * Intelligent intent detection, context awareness, and task planning
 */

export interface ConversationContext {
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  uploadedFiles: Array<{ type: 'image' | 'pdf'; name: string }>;
  currentTask?: 'product_creation' | 'product_update' | 'general_chat' | 'help';
  productDraftInProgress?: boolean;
  lastIntent?: DetectedIntent;
}

export interface DetectedIntent {
  type: 'product_creation' | 'product_update' | 'general_question' | 'help_request' | 'casual_chat' | 'settings_query';
  confidence: number;
  reasoning: string;
  suggestedAction: string;
  extractedData?: {
    url?: string;
    hasImages?: boolean;
    hasPDF?: boolean;
    productName?: string;
    partialInfo?: Record<string, any>;
  };
}

/**
 * Advanced intent detection using context and conversation history
 */
export function detectIntent(
  userMessage: string,
  context: ConversationContext
): DetectedIntent {
  const message = userMessage.trim();
  const lowerMessage = message.toLowerCase();

  // Extract URL if present
  const urlMatch = message.match(/(https?:\/\/[^\s]+)/);
  const extractedUrl = urlMatch ? urlMatch[0] : null;

  // Check file context
  const hasImages = context.uploadedFiles.some(f => f.type === 'image');
  const hasPDF = context.uploadedFiles.some(f => f.type === 'pdf');
  const hasAnyFiles = hasImages || hasPDF;

  // Analyze recent conversation
  const recentUserMessages = context.recentMessages
    .filter(m => m.role === 'user')
    .slice(-3)
    .map(m => m.content.toLowerCase());

  const conversationHistory = recentUserMessages.join(' ');

  // Pattern matching for different intents
  const productCreationPatterns = [
    'add', 'create', 'new product', 'import', 'extract', 'analyze this',
    'process', 'make a product', 'product from', 'add product'
  ];

  const productUpdatePatterns = [
    'update', 'edit', 'change', 'modify', 'fix', 'correct', 'adjust'
  ];

  const helpPatterns = [
    'help', 'how', 'what can', 'guide', 'tutorial', 'explain',
    'show me', 'can you', 'do you', 'are you able'
  ];

  const casualPatterns = [
    'hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'okay',
    'cool', 'nice', 'great', 'awesome'
  ];

  // PRIORITY 1: Direct product creation signals
  if (extractedUrl || hasAnyFiles) {
    return {
      type: 'product_creation',
      confidence: 0.95,
      reasoning: extractedUrl 
        ? 'URL detected in message - clear product extraction intent'
        : 'Files uploaded - ready for product extraction',
      suggestedAction: 'start_extraction',
      extractedData: {
        url: extractedUrl || undefined,
        hasImages,
        hasPDF,
      }
    };
  }

  // PRIORITY 2: Explicit product creation keywords + context
  const hasProductCreationKeyword = productCreationPatterns.some(pattern => 
    lowerMessage.includes(pattern)
  );

  if (hasProductCreationKeyword) {
    if (context.uploadedFiles.length > 0 || extractedUrl) {
      return {
        type: 'product_creation',
        confidence: 0.9,
        reasoning: 'Product creation keyword with available data',
        suggestedAction: 'start_extraction',
        extractedData: { url: extractedUrl || undefined, hasImages, hasPDF }
      };
    } else {
      return {
        type: 'product_creation',
        confidence: 0.75,
        reasoning: 'Product creation intent but missing data source',
        suggestedAction: 'request_product_source',
        extractedData: {}
      };
    }
  }

  // PRIORITY 3: Product update intent
  const hasUpdateKeyword = productUpdatePatterns.some(pattern =>
    lowerMessage.includes(pattern)
  );

  if (hasUpdateKeyword) {
    return {
      type: 'product_update',
      confidence: 0.8,
      reasoning: 'Update/edit keyword detected',
      suggestedAction: 'clarify_update_target',
      extractedData: {}
    };
  }

  // PRIORITY 4: Help request
  const hasHelpKeyword = helpPatterns.some(pattern =>
    lowerMessage.includes(pattern)
  );

  if (hasHelpKeyword) {
    return {
      type: 'help_request',
      confidence: 0.85,
      reasoning: 'Help or guidance requested',
      suggestedAction: 'provide_contextual_help',
      extractedData: {}
    };
  }

  // PRIORITY 5: Casual/greeting
  const isCasual = casualPatterns.some(pattern =>
    lowerMessage === pattern || lowerMessage.startsWith(pattern + ' ')
  ) || message.length < 10;

  if (isCasual) {
    return {
      type: 'casual_chat',
      confidence: 0.7,
      reasoning: 'Casual greeting or acknowledgment',
      suggestedAction: 'friendly_response',
      extractedData: {}
    };
  }

  // PRIORITY 6: Settings/configuration
  if (lowerMessage.includes('setting') || lowerMessage.includes('config') ||
      lowerMessage.includes('api key') || lowerMessage.includes('model')) {
    return {
      type: 'settings_query',
      confidence: 0.8,
      reasoning: 'Settings or configuration inquiry',
      suggestedAction: 'explain_settings',
      extractedData: {}
    };
  }

  // DEFAULT: General question
  return {
    type: 'general_question',
    confidence: 0.6,
    reasoning: 'General inquiry or unclear intent',
    suggestedAction: 'conversational_guidance',
    extractedData: {}
  };
}

/**
 * Generate intelligent, context-aware response
 * NO RIGID TEMPLATES - Natural conversation only
 */
export function generateAgenticResponse(
  intent: DetectedIntent,
  userMessage: string,
  context: ConversationContext
): string {
  const { type, suggestedAction, extractedData } = intent;

  switch (type) {
    case 'product_creation':
      if (suggestedAction === 'start_extraction') {
        // Will be handled by extraction flow - return empty
        return '';
      }
      if (suggestedAction === 'request_product_source') {
        // Be natural and brief
        return `Sure! I can help you add that product. Just share the product URL, upload some images, or attach a PDF and I'll take it from there.`;
      }
      break;

    case 'product_update':
      return `I can help with that! Which product do you want to update, and what changes would you like to make?`;

    case 'help_request':
      // Context-aware help - only if they explicitly ask
      if (context.currentTask === 'product_creation') {
        return `I'm analyzing your product right now. Hang tight! I'll extract the title, description, specs, images, and suggest a category. You'll review everything before publishing. 🚀`;
      }

      // Only show full capabilities if they really ask for help
      if (userMessage.toLowerCase().includes('what can') || userMessage.toLowerCase().includes('how does')) {
        return `I help you add products automatically. Here's how it works:

**What I do:**
• Extract product data from URLs (any e-commerce or product page)
• Analyze product images to extract details
• Parse PDF catalogs and spec sheets
• Generate professional descriptions
• Suggest categories automatically
• Optimize and process images

**How to use:**
Just paste a URL, upload images, or attach a PDF. I'll figure out the rest. No forms, no steps - just natural conversation.

${context.uploadedFiles.length > 0 ? '\n💡 I see you already have files uploaded. Want me to process them?' : '\n💡 Try it - paste a product link and watch the magic!'}`;
      }

      // Brief help for simple "help"
      return `I can automatically add products from URLs, images, or PDFs. Just paste/upload and I'll handle everything! What would you like to do?`;

    case 'casual_chat':
      // Natural, varied responses
      const casualResponses = [
        `Hey! What can I help you with?`,
        `Hi there! Ready to add some products?`,
        `Hello! What would you like to do today?`,
      ];

      // Check for gratitude
      if (userMessage.toLowerCase().includes('thank')) {
        return `You're very welcome! 😊`;
      }

      // Check for confirmation/acknowledgment
      if (['ok', 'okay', 'cool', 'nice', 'great', 'awesome', 'perfect'].some(w => 
        userMessage.toLowerCase().trim() === w || userMessage.toLowerCase().trim() === w + '!'
      )) {
        return context.uploadedFiles.length > 0 
          ? `Ready when you are! Say the word and I'll process those files.`
          : `👍`;
      }

      return casualResponses[Math.floor(Math.random() * casualResponses.length)];

    case 'settings_query':
      return `Settings are available at the top of this page (Settings button). You can adjust the AI model, set custom instructions, and track usage there.

Currently using **GPT-5.2** for maximum quality.`;

    case 'general_question':
    default:
      // Be helpful and guide naturally without repeating templates
      if (context.uploadedFiles.length > 0) {
        return `I see you have ${context.uploadedFiles.length} file(s) ready. Want me to analyze them and create a product?`;
      }

      // Very brief, natural guidance
      return `I can help with that! If you want to add a product, just share a URL, upload images, or attach a PDF. Otherwise, let me know what you need!`;
  }

  return '';
}

/**
 * Generate contextual welcome message (only for first visit)
 */
export function generateWelcomeMessage(context: {
  userName?: string;
  isFirstVisit?: boolean;
  hasApiKey: boolean;
}): string {
  if (!context.hasApiKey) {
    return `👋 Welcome! To get started, please add your OpenAI API key in **Settings** (top of page).`;
  }

  if (context.isFirstVisit) {
    const greeting = context.userName ? `Hi ${context.userName}!` : 'Hey there!';
    return `${greeting} I'm your AI assistant. I can create products from URLs, images, or PDFs automatically.

Just paste a link, upload files, or ask me anything. Let's go! 🚀`;
  }

  // Returning user - be brief and welcoming
  const greetings = [
    `Welcome back! What can I help with today?`,
    `Hey! Ready to add more products?`,
    `Hi! What would you like to do?`,
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * Extract structured data from natural language
 */
export function extractStructuredData(message: string): {
  url?: string;
  productName?: string;
  price?: string;
  category?: string;
} {
  const data: any = {};

  // Extract URL
  const urlMatch = message.match(/(https?:\/\/[^\s]+)/);
  if (urlMatch) {
    data.url = urlMatch[0];
  }

  // Extract product name (simple heuristic)
  const nameMatch = message.match(/(?:product|item|add|create)\s+(?:called\s+)?["']([^"']+)["']/i);
  if (nameMatch) {
    data.productName = nameMatch[1];
  }

  // Extract price
  const priceMatch = message.match(/(?:price|cost|₹|Rs\.?)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i);
  if (priceMatch) {
    data.price = priceMatch[1].replace(/,/g, '');
  }

  return data;
}