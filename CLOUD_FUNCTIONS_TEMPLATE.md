# Firebase Cloud Functions - AI Assistant Template

This template provides a complete, production-ready Firebase Cloud Functions setup for the AI Product Assistant.

---

## Setup Steps

### 1. Initialize Firebase Functions

```bash
# In your project root
firebase init functions

# When prompted, select:
# ✓ TypeScript
# ✓ ESLint
# ✓ Install dependencies with npm
```

### 2. Install Dependencies

```bash
cd functions
npm install openai@4.28.0 axios@1.6.7 sharp@0.33.2
npm install --save-dev @types/node
```

### 3. Create File Structure

```
functions/
├── src/
│   ├── index.ts
│   ├── ai/
│   │   ├── openaiClient.ts
│   │   ├── imageProcessor.ts
│   │   └── prompts.ts
│   └── utils/
│       └── helpers.ts
├── package.json
└── tsconfig.json
```

---

## File Templates

### `functions/src/index.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { processProductTask } from './ai/processProductTask';

// Initialize Firebase Admin
admin.initializeApp();

// Export Cloud Functions
export const onTaskCreated = processProductTask;
```

---

### `functions/src/ai/openaiClient.ts`

```typescript
import OpenAI from 'openai';

export interface ProductExtractionInput {
  url?: string;
  screenshots?: string[];
  additionalText?: string;
  customInstructions: string[];
}

export interface ExtractedProductData {
  title: string;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  tags: string[];
  images: string[];
  videoUrl?: string;
  stockStatus: 'in-stock' | 'out-of-stock' | 'preorder';
  qualityScore: number;
  warnings: string[];
  tokensUsed: number;
  cost: number;
}

export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
    });
  }

  async extractProductData(
    input: ProductExtractionInput
  ): Promise<ExtractedProductData> {
    const systemPrompt = this.buildSystemPrompt(input.customInstructions);
    const userPrompt = this.buildUserPrompt(input);

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsedData = JSON.parse(content);

      // Calculate cost
      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = this.calculateCost(
        response.usage?.prompt_tokens || 0,
        response.usage?.completion_tokens || 0
      );

      return {
        ...parsedData,
        tokensUsed,
        cost,
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`Failed to extract product data: ${error.message}`);
    }
  }

  private buildSystemPrompt(customInstructions: string[]): string {
    const basePrompt = `You are an expert e-commerce product data specialist. Your task is to analyze product information and extract structured data for B2B catalogs.

RULES:
1. Extract only factual information
2. Do not hallucinate or invent data
3. Mark low-confidence items clearly
4. Use professional B2B language
5. Format specifications consistently
6. Provide quality assessment`;

    const customSection = customInstructions.length > 0
      ? `\n\nCUSTOM INSTRUCTIONS:\n${customInstructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}`
      : '';

    return basePrompt + customSection;
  }

  private buildUserPrompt(input: ProductExtractionInput): string {
    let prompt = 'Extract product data from the following:\n\n';

    if (input.url) {
      prompt += `Product URL: ${input.url}\n\n`;
    }

    if (input.additionalText) {
      prompt += `Additional Information:\n${input.additionalText}\n\n`;
    }

    if (input.screenshots && input.screenshots.length > 0) {
      prompt += `Screenshots: ${input.screenshots.length} images provided\n\n`;
    }

    prompt += `Return ONLY valid JSON in this exact format:
{
  "title": "Product name",
  "description": "Rich HTML description with <p>, <ul>, <strong> tags",
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "specifications": {
    "Brand": "Value",
    "Model": "Value",
    "Power": "Value"
  },
  "tags": ["tag1", "tag2", "tag3"],
  "images": ["image_url_1", "image_url_2"],
  "videoUrl": "youtube_url or null",
  "stockStatus": "in-stock",
  "qualityScore": 85,
  "warnings": ["Any data quality issues"]
}`;

    return prompt;
  }

  private calculateCost(promptTokens: number, completionTokens: number): number {
    // GPT-4 Vision pricing (per 1M tokens)
    const inputCostPer1M = 10; // $10 per 1M input tokens
    const outputCostPer1M = 30; // $30 per 1M output tokens

    const inputCost = (promptTokens / 1000000) * inputCostPer1M;
    const outputCost = (completionTokens / 1000000) * outputCostPer1M;

    return inputCost + outputCost;
  }

  async generateRichDescription(data: any): Promise<{ description: string }> {
    // Enhance the description with better HTML formatting
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional B2B product description writer. Create rich, detailed HTML descriptions.',
        },
        {
          role: 'user',
          content: `Create a professional B2B product description in HTML format for: ${data.title}

Features: ${data.features?.join(', ')}
Specifications: ${JSON.stringify(data.specifications)}

Use <p>, <ul>, <li>, <strong>, <em> tags. Make it informative and professional.`,
        },
      ],
      max_tokens: 1500,
    });

    return {
      description: response.choices[0]?.message?.content || data.description,
    };
  }
}
```

---

### `functions/src/ai/imageProcessor.ts`

```typescript
import axios from 'axios';
import sharp from 'sharp';
import * as admin from 'firebase-admin';

export async function processImages(imageUrls: string[]): Promise<string[]> {
  const processedUrls: string[] = [];

  for (const url of imageUrls) {
    try {
      // Download image
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const imageBuffer = Buffer.from(response.data);

      // Optimize image with Sharp
      const optimized = await sharp(imageBuffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();

      // Upload to Firebase Storage
      const bucket = admin.storage().bucket();
      const filename = `products/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webp`;
      const file = bucket.file(filename);

      await file.save(optimized, {
        metadata: {
          contentType: 'image/webp',
        },
      });

      // Make file publicly accessible
      await file.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      processedUrls.push(publicUrl);
    } catch (error) {
      console.error(`Error processing image ${url}:`, error);
      // Continue with other images
    }
  }

  return processedUrls;
}
```

---

### `functions/src/ai/categoryMatcher.ts`

```typescript
import * as admin from 'firebase-admin';

export interface CategorySuggestion {
  path: string;
  categoryId?: string;
  confidence: number;
  shouldCreate: boolean;
  newCategoryDetails?: {
    name: string;
    parentPath?: string;
    description: string;
    suggestedImage: string;
  };
}

export async function suggestCategory(
  productData: any,
  confidenceThreshold: number
): Promise<CategorySuggestion> {
  const db = admin.firestore();

  // Get all existing categories
  const categoriesSnap = await db.collection('categories').get();
  const categories = categoriesSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Simple keyword matching (can be enhanced with embeddings)
  const productKeywords = [
    ...productData.tags,
    ...productData.title.toLowerCase().split(' '),
  ].filter(word => word.length > 3);

  let bestMatch = {
    category: null as any,
    score: 0,
  };

  for (const category of categories) {
    const categoryKeywords = category.name.toLowerCase().split(' ');
    const matchCount = productKeywords.filter(keyword =>
      categoryKeywords.some(catKeyword => catKeyword.includes(keyword))
    ).length;

    const score = matchCount / Math.max(productKeywords.length, 1);

    if (score > bestMatch.score) {
      bestMatch = { category, score };
    }
  }

  const confidence = bestMatch.score;

  if (confidence >= confidenceThreshold && bestMatch.category) {
    // Found good match
    return {
      path: bestMatch.category.name,
      categoryId: bestMatch.category.id,
      confidence,
      shouldCreate: false,
    };
  } else {
    // Suggest new category
    const suggestedName = inferCategoryName(productData);

    return {
      path: suggestedName,
      confidence,
      shouldCreate: true,
      newCategoryDetails: {
        name: suggestedName,
        description: `Category for ${suggestedName} products`,
        suggestedImage: 'Use category icon or product image',
      },
    };
  }
}

function inferCategoryName(productData: any): string {
  // Simple inference from product title and tags
  const commonCategories = [
    'Electronics',
    'Components',
    'Accessories',
    'Industrial',
    'Tools',
    'Lighting',
  ];

  for (const cat of commonCategories) {
    if (
      productData.title.toLowerCase().includes(cat.toLowerCase()) ||
      productData.tags.some((tag: string) =>
        tag.toLowerCase().includes(cat.toLowerCase())
      )
    ) {
      return cat;
    }
  }

  // Default to first tag or generic
  return productData.tags[0] || 'General Products';
}
```

---

### `functions/src/ai/processProductTask.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { OpenAIClient } from './openaiClient';
import { processImages } from './imageProcessor';
import { suggestCategory } from './categoryMatcher';

export const processProductTask = functions.firestore
  .document('aiTasks/{taskId}')
  .onCreate(async (snap, context) => {
    const taskId = context.params.taskId;
    const taskData = snap.data();
    const db = admin.firestore();

    try {
      // Update: analyzing_input
      await db.doc(`aiTasks/${taskId}`).update({
        status: 'processing',
        stage: 'analyzing_input',
        progress: 10,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Get AI settings
      const settingsSnap = await db.doc(`aiSettings/${taskData.adminId}`).get();
      const settings = settingsSnap.data();

      if (!settings?.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      // Initialize OpenAI
      const openai = new OpenAIClient(settings.openaiApiKey);

      // Extract data
      await db.doc(`aiTasks/${taskId}`).update({
        stage: 'extracting_data',
        progress: 30,
      });

      const extractedData = await openai.extractProductData({
        url: taskData.input.url,
        screenshots: taskData.input.screenshots,
        additionalText: taskData.input.additionalText,
        customInstructions: settings.customInstructions || [],
      });

      // Process images
      await db.doc(`aiTasks/${taskId}`).update({
        stage: 'processing_images',
        progress: 50,
      });

      const processedImages = await processImages(extractedData.images);

      // Generate content
      await db.doc(`aiTasks/${taskId}`).update({
        stage: 'generating_content',
        progress: 70,
      });

      const enrichedContent = await openai.generateRichDescription(extractedData);

      // Suggest category
      await db.doc(`aiTasks/${taskId}`).update({
        stage: 'suggesting_category',
        progress: 85,
      });

      const categoryInfo = await suggestCategory(
        extractedData,
        settings.categoryConfidenceThreshold || 0.7
      );

      // Create draft
      await db.doc(`aiTasks/${taskId}`).update({
        stage: 'creating_draft',
        progress: 95,
      });

      const draftRef = await db.collection('productDrafts').add({
        adminId: taskData.adminId,
        taskId,
        status: 'review_required',
        product: {
          name: extractedData.title,
          description: enrichedContent.description,
          shortDescription: extractedData.features,
          images: processedImages,
          specs: extractedData.specifications,
          tags: extractedData.tags,
          price: null,
          currency: 'INR',
          stockStatus: extractedData.stockStatus,
          productType: 'simple',
          videoUrl: extractedData.videoUrl,
        },
        suggestedCategory: categoryInfo,
        aiMetadata: {
          sourceUrl: taskData.input.url,
          model: settings.model,
          extractionMethod: taskData.input.screenshots ? 'vision' : 'manual',
          qualityScore: extractedData.qualityScore,
          warnings: extractedData.warnings,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Complete
      await db.doc(`aiTasks/${taskId}`).update({
        status: 'completed',
        stage: 'completed',
        progress: 100,
        output: {
          draftId: draftRef.id,
          warnings: extractedData.warnings,
        },
        metadata: {
          model: settings.model,
          tokensUsed: extractedData.tokensUsed,
          cost: extractedData.cost,
          duration: Date.now() - taskData.createdAt.toMillis(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Add success message to conversation
      if (taskData.conversationId) {
        await addMessageToConversation(db, taskData.conversationId, {
          role: 'assistant',
          content: `✅ Product draft created successfully!

**Title**: ${extractedData.title}
**Category**: ${categoryInfo.path}
**Quality Score**: ${extractedData.qualityScore}/100
**Images**: ${processedImages.length} processed
**Cost**: $${extractedData.cost.toFixed(3)} (~₹${(extractedData.cost * 83).toFixed(2)})`,
          metadata: {
            type: 'text',
            draftId: draftRef.id,
          },
        });
      }
    } catch (error) {
      console.error('Error processing task:', error);

      await db.doc(`aiTasks/${taskId}`).update({
        status: 'failed',
        error: {
          message: error.message,
          code: 'PROCESSING_ERROR',
          stage: taskData.stage || 'unknown',
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

async function addMessageToConversation(
  db: admin.firestore.Firestore,
  conversationId: string,
  message: any
) {
  const convRef = db.doc(`aiConversations/${conversationId}`);
  const convSnap = await convRef.get();
  const convData = convSnap.data();

  if (convData) {
    await convRef.update({
      messages: admin.firestore.FieldValue.arrayUnion({
        id: `msg_${Date.now()}`,
        ...message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
```

---

## Deploy

```bash
# Build
npm run build

# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:onTaskCreated
```

---

## Environment Variables (Optional)

```bash
# Set OpenAI API key as fallback
firebase functions:config:set openai.key="sk-..."

# View config
firebase functions:config:get
```

---

## Testing

```bash
# Serve functions locally
firebase emulators:start --only functions,firestore

# Test with Firestore emulator
npm run serve
```

---

## Monitoring

```bash
# View logs
firebase functions:log

# Watch logs in real-time
firebase functions:log --only onTaskCreated
```

---

## Production Checklist

- [ ] Install all dependencies
- [ ] Deploy Firestore security rules
- [ ] Configure OpenAI API key in admin settings
- [ ] Test with a simple product
- [ ] Monitor costs and usage
- [ ] Set up error alerts

---

**Ready to deploy!** Follow these templates for a production-ready AI backend.
