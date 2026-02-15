/**
 * Intelligent Model Router
 * Automatically selects the best AI model for each task
 * Maximizes quality - no cost optimization
 */

export type TaskType = 
  | 'vision_extraction'      // Extract from images
  | 'url_extraction'          // Extract from URLs (text + scraping)
  | 'pdf_parsing'             // Parse PDF documents
  | 'description_generation'  // Generate product descriptions
  | 'categorization'          // Suggest categories
  | 'general_reasoning';      // General Q&A and reasoning

export interface ModelSelection {
  model: string;
  reasoning: string;
  capabilities: string[];
  maxTokens: number;
}

/**
 * Select the optimal model for a given task
 * Priority: Maximum quality and capability
 */
export function selectModelForTask(
  task: TaskType,
  hasImages: boolean = false,
  hasPDF: boolean = false
): ModelSelection {
  // VISION TASKS - Require vision-capable models
  if (task === 'vision_extraction' || hasImages) {
    return {
      model: 'gpt-5.2',
      reasoning: 'Vision extraction requires the most capable model with advanced image understanding',
      capabilities: ['vision', 'reasoning', 'extraction', 'structured_output'],
      maxTokens: 8000,
    };
  }

  // PDF PARSING - Complex document understanding
  if (task === 'pdf_parsing' || hasPDF) {
    return {
      model: 'gpt-5.2',
      reasoning: 'PDF parsing requires advanced reasoning and document understanding',
      capabilities: ['document_parsing', 'reasoning', 'extraction', 'structured_output'],
      maxTokens: 12000, // PDFs can be long
    };
  }

  // URL EXTRACTION - Web content analysis
  if (task === 'url_extraction') {
    return {
      model: 'gpt-5.2',
      reasoning: 'URL extraction benefits from strong reasoning to parse HTML and extract meaningful data',
      capabilities: ['html_parsing', 'reasoning', 'extraction', 'structured_output'],
      maxTokens: 8000,
    };
  }

  // DESCRIPTION GENERATION - Creative writing
  if (task === 'description_generation') {
    return {
      model: 'gpt-5.2',
      reasoning: 'Description generation requires creativity and professional writing capability',
      capabilities: ['creative_writing', 'professional_tone', 'b2b_expertise'],
      maxTokens: 4000,
    };
  }

  // CATEGORIZATION - Pattern recognition
  if (task === 'categorization') {
    return {
      model: 'gpt-5.2',
      reasoning: 'Categorization benefits from strong reasoning and pattern matching',
      capabilities: ['classification', 'reasoning', 'pattern_matching'],
      maxTokens: 2000,
    };
  }

  // DEFAULT - General reasoning
  return {
    model: 'gpt-5.2',
    reasoning: 'Using strongest model for maximum quality in general tasks',
    capabilities: ['reasoning', 'conversation', 'problem_solving'],
    maxTokens: 4000,
  };
}

/**
 * Get model recommendations based on input combination
 */
export function getModelRecommendation(input: {
  hasUrl?: boolean;
  hasImages?: boolean;
  hasPDF?: boolean;
  userMessage?: string;
}): ModelSelection {
  // Multi-modal inputs (URL + Images)
  if (input.hasUrl && input.hasImages) {
    return {
      model: 'gpt-5.2',
      reasoning: 'Multi-source extraction (URL + images) requires the most capable model',
      capabilities: ['vision', 'html_parsing', 'reasoning', 'multi_modal'],
      maxTokens: 10000,
    };
  }

  // Images only
  if (input.hasImages) {
    return selectModelForTask('vision_extraction', true, false);
  }

  // PDF only
  if (input.hasPDF) {
    return selectModelForTask('pdf_parsing', false, true);
  }

  // URL only
  if (input.hasUrl) {
    return selectModelForTask('url_extraction');
  }

  // Text-only conversation
  return selectModelForTask('general_reasoning');
}

/**
 * Get fallback models in priority order
 * If primary model fails, try these
 */
export function getFallbackModels(primaryModel: string): string[] {
  const fallbackChain: Record<string, string[]> = {
    'gpt-5.2': ['gpt-4.1', 'gpt-4o', 'gpt-4-turbo', 'gpt-4'],
    'gpt-4.1': ['gpt-4o', 'gpt-4-turbo', 'gpt-4'],
    'gpt-4o': ['gpt-4-turbo', 'gpt-4'],
    'gpt-4-turbo': ['gpt-4'],
    'gpt-4': ['gpt-3.5-turbo'], // Last resort
  };

  return fallbackChain[primaryModel] || ['gpt-4o', 'gpt-4'];
}

/**
 * Check if a model supports vision
 */
export function supportsVision(model: string): boolean {
  const visionModels = [
    'gpt-5.2',
    'gpt-5.2-mini',
    'gpt-4.1',
    'gpt-4.1-preview',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-vision-preview',
    'gpt-4-turbo',
  ];

  return visionModels.some(vm => model.includes(vm));
}

/**
 * Estimate task complexity and recommend token allocation
 */
export function estimateTokenRequirement(input: {
  hasUrl?: boolean;
  hasImages?: boolean;
  hasPDF?: boolean;
  numberOfImages?: number;
}): number {
  let baseTokens = 2000; // Minimum for structured output

  if (input.hasUrl) baseTokens += 2000; // URLs can have complex HTML
  if (input.hasImages) baseTokens += (input.numberOfImages || 1) * 1500; // Images add context
  if (input.hasPDF) baseTokens += 6000; // PDFs can be extensive

  // Cap at reasonable maximum
  return Math.min(baseTokens, 16000);
}
