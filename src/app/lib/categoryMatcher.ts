/**
 * Category Intelligence Service
 * Smart category matching and suggestion system
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Category } from './types';

export interface CategorySuggestion {
  suggestedName: string;
  categoryId?: string;
  confidence: number;
  shouldCreate: boolean;
  reasoning: string;
  alternatives: Array<{
    id: string;
    name: string;
    score: number;
  }>;
}

/**
 * Suggest category for a product based on extracted data
 */
export async function suggestCategory(
  productData: {
    title: string;
    tags: string[];
    suggestedCategory: string;
    description: string;
    specifications: Record<string, string>;
  },
  confidenceThreshold: number = 0.7
): Promise<CategorySuggestion> {
  try {
    // Get all existing categories
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    const categories: Category[] = categoriesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Category));

    if (categories.length === 0) {
      // No categories exist, suggest creating first one
      return {
        suggestedName: productData.suggestedCategory || 'General Products',
        confidence: 0.5,
        shouldCreate: true,
        reasoning: 'No categories exist yet. Creating first category.',
        alternatives: [],
      };
    }

    // Extract keywords from product
    const productKeywords = extractKeywords(productData);

    // Score each category
    const scores = categories.map(category => ({
      category,
      score: calculateCategoryScore(category, productKeywords),
    }));

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    const bestMatch = scores[0];
    const alternatives = scores.slice(1, 4).map(s => ({
      id: s.category.id,
      name: s.category.name,
      score: s.score,
    }));

    // Decide if we should use existing or create new
    if (bestMatch.score >= confidenceThreshold) {
      // Good match found
      return {
        suggestedName: bestMatch.category.name,
        categoryId: bestMatch.category.id,
        confidence: bestMatch.score,
        shouldCreate: false,
        reasoning: `Strong match found with existing category "${bestMatch.category.name}" (${(bestMatch.score * 100).toFixed(0)}% confidence)`,
        alternatives,
      };
    } else {
      // No good match, suggest creating new
      const newCategoryName = productData.suggestedCategory || inferCategoryName(productData);

      return {
        suggestedName: newCategoryName,
        confidence: bestMatch.score,
        shouldCreate: true,
        reasoning: `No strong match found. Best match "${bestMatch.category.name}" is only ${(bestMatch.score * 100).toFixed(0)}% confident. Suggesting new category "${newCategoryName}".`,
        alternatives: alternatives.length > 0 ? alternatives : scores.slice(0, 3).map(s => ({
          id: s.category.id,
          name: s.category.name,
          score: s.score,
        })),
      };
    }
  } catch (error) {
    console.error('Error in category suggestion:', error);
    
    // Fallback suggestion
    return {
      suggestedName: productData.suggestedCategory || 'General Products',
      confidence: 0.3,
      shouldCreate: true,
      reasoning: 'Error occurred while analyzing categories. Using fallback suggestion.',
      alternatives: [],
    };
  }
}

/**
 * Extract keywords from product data
 */
function extractKeywords(productData: {
  title: string;
  tags: string[];
  description: string;
  specifications: Record<string, string>;
}): string[] {
  const keywords = new Set<string>();

  // From title
  const titleWords = productData.title.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2);
  titleWords.forEach(word => keywords.add(word));

  // From tags
  productData.tags.forEach(tag => {
    keywords.add(tag.toLowerCase());
    tag.split(/\s+/).forEach(word => {
      if (word.length > 2) keywords.add(word.toLowerCase());
    });
  });

  // From specifications (keys and values)
  Object.entries(productData.specifications).forEach(([key, value]) => {
    keywords.add(key.toLowerCase());
    value.split(/\s+/).forEach(word => {
      if (word.length > 2 && !/^\d+$/.test(word)) {
        keywords.add(word.toLowerCase());
      }
    });
  });

  return Array.from(keywords);
}

/**
 * Calculate similarity score between category and product keywords
 */
function calculateCategoryScore(category: Category, productKeywords: string[]): number {
  const categoryKeywords = category.name.toLowerCase().split(/\s+/);
  
  let matchCount = 0;
  let totalWeight = 0;

  productKeywords.forEach(keyword => {
    categoryKeywords.forEach(catKeyword => {
      if (catKeyword.includes(keyword) || keyword.includes(catKeyword)) {
        matchCount++;
      }
    });
  });

  // Base score from keyword matching
  const baseScore = matchCount / Math.max(productKeywords.length, categoryKeywords.length);

  // Boost for exact substring matches
  const categoryNameLower = category.name.toLowerCase();
  const exactMatches = productKeywords.filter(keyword => 
    categoryNameLower.includes(keyword) || keyword.length > 4 && keyword.includes(categoryNameLower)
  ).length;

  const exactBoost = (exactMatches / productKeywords.length) * 0.3;

  return Math.min(baseScore + exactBoost, 1.0);
}

/**
 * Infer category name from product data
 */
function inferCategoryName(productData: {
  title: string;
  tags: string[];
  specifications: Record<string, string>;
}): string {
  // Common category patterns
  const patterns = [
    { keywords: ['led', 'light', 'lamp', 'bulb'], category: 'LED Lights' },
    { keywords: ['electronic', 'circuit', 'pcb'], category: 'Electronics' },
    { keywords: ['component', 'resistor', 'capacitor'], category: 'Electronic Components' },
    { keywords: ['cable', 'wire', 'connector'], category: 'Cables & Connectors' },
    { keywords: ['power', 'adapter', 'supply'], category: 'Power Supplies' },
    { keywords: ['sensor', 'module'], category: 'Sensors & Modules' },
    { keywords: ['tool', 'equipment'], category: 'Tools & Equipment' },
    { keywords: ['industrial'], category: 'Industrial Equipment' },
  ];

  const titleLower = productData.title.toLowerCase();
  const allKeywords = [
    ...productData.tags.map(t => t.toLowerCase()),
    ...Object.keys(productData.specifications).map(k => k.toLowerCase()),
  ];

  for (const pattern of patterns) {
    for (const keyword of pattern.keywords) {
      if (titleLower.includes(keyword) || allKeywords.some(k => k.includes(keyword))) {
        return pattern.category;
      }
    }
  }

  // Fallback: use first tag if available
  if (productData.tags.length > 0) {
    const tag = productData.tags[0];
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }

  return 'General Products';
}

/**
 * Validate category name
 */
export function validateCategoryName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Category name cannot be empty' };
  }

  if (name.length < 2) {
    return { valid: false, error: 'Category name must be at least 2 characters' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Category name must be less than 50 characters' };
  }

  // Check for valid characters
  if (!/^[a-zA-Z0-9\s&\-\.]+$/.test(name)) {
    return { valid: false, error: 'Category name contains invalid characters' };
  }

  return { valid: true };
}
