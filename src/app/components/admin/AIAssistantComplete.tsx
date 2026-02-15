import { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Image as ImageIcon, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import {
  getAdminConversation,
  createAIConversation,
  addMessageToConversation,
  updateConversationContext,
  getAISettings,
  createAITask,
  createProductDraft,
  updateAIUsage,
} from '../../lib/aiService';
import { suggestCategory } from '../../lib/categoryMatcher';
import { AIConversation } from '../../lib/types';
import { OpenAIClient, scrapeProductUrl } from '../../lib/openaiClient';
import { processImages, fileToDataUrl } from '../../lib/imageProcessor';
import { toast } from 'sonner';
import { ProductDraftReview } from './ProductDraftReview';
import { showPermissionErrorBanner } from '../../lib/permissionErrorHandler';

interface ProgressStep {
  step: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  message: string;
}

export function AIAssistantComplete() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && isOpen) {
      loadOrCreateConversation();
    }
  }, [user, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, progress]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadOrCreateConversation = async () => {
    if (!user) return;

    try {
      let conv = await getAdminConversation(user.uid);
      
      if (!conv) {
        const convId = await createAIConversation(user.uid);
        conv = await getAdminConversation(user.uid);
      }

      setConversation(conv);
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      
      // Show helpful error message
      if (error.code === 'permission-denied') {
        showPermissionErrorBanner();
      } else {
        toast.error('Failed to load conversation');
      }
    }
  };

  const updateProgress = (step: string, status: ProgressStep['status'], message: string) => {
    setProgress(prev => {
      const existing = prev.find(p => p.step === step);
      if (existing) {
        return prev.map(p => p.step === step ? { step, status, message } : p);
      }
      return [...prev, { step, status, message }];
    });
  };

  const addAssistantMessage = async (content: string, metadata?: any) => {
    if (!conversation) return;

    await addMessageToConversation(conversation.id, {
      role: 'assistant',
      content,
      metadata,
    });

    // Reload conversation
    const updated = await getAdminConversation(user!.uid);
    setConversation(updated);
  };

  const handleSendMessage = async () => {
    if (!conversation || !user) return;
    if (!message.trim() && uploadedImages.length === 0) return;

    const userMessage = message;
    const images = [...uploadedImages];
    setMessage('');
    setUploadedImages([]);
    setProcessing(true);
    setProgress([]);

    try {
      // Add user message
      await addMessageToConversation(conversation.id, {
        role: 'user',
        content: userMessage,
        metadata: {
          type: images.length > 0 ? 'image' : 'text',
          imageCount: images.length,
        },
      });

      // Reload conversation
      let updated = await getAdminConversation(user.uid);
      setConversation(updated);

      // Get AI settings
      const aiSettings = await getAISettings(user.uid);
      if (!aiSettings || !aiSettings.openaiApiKey) {
        await addAssistantMessage(
          '⚠️ OpenAI API key not configured. Please go to Settings → AI Product Assistant and configure your API key first.'
        );
        setProcessing(false);
        return;
      }

      // Check if this is a product URL or request
      const urlMatch = userMessage.match(/(https?:\/\/[^\s]+)/);
      const isProductRequest = 
        urlMatch || 
        images.length > 0 ||
        userMessage.toLowerCase().includes('add') ||
        userMessage.toLowerCase().includes('product') ||
        conversation.context.mode === 'add_product';

      if (!isProductRequest) {
        // General conversation
        await addAssistantMessage(getHelpResponse(userMessage));
        setProcessing(false);
        return;
      }

      // Process product
      await processProduct(userMessage, images, urlMatch?.[0], aiSettings);

    } catch (error: any) {
      console.error('Error processing message:', error);
      await addAssistantMessage(
        `❌ Error: ${error.message}\n\nPlease try again or check your settings.`
      );
    } finally {
      setProcessing(false);
    }
  };

  const processProduct = async (
    userMessage: string,
    images: File[],
    productUrl: string | undefined,
    aiSettings: any
  ) => {
    try {
      // Step 1: Initialize
      updateProgress('init', 'active', 'Starting product analysis...');
      await addAssistantMessage('🚀 Starting product extraction...');

      // Step 2: Extract data with AI
      updateProgress('extract', 'active', 'Analyzing product data with AI...');
      
      const openai = new OpenAIClient(aiSettings.openaiApiKey);
      
      // Convert uploaded images to data URLs
      const imageDataUrls: string[] = [];
      if (images.length > 0) {
        updateProgress('images-upload', 'active', 'Processing uploaded images...');
        for (const img of images) {
          const dataUrl = await fileToDataUrl(img);
          imageDataUrls.push(dataUrl);
        }
      }

      // Scrape URL if provided (this might fail due to CORS - that's expected)
      let additionalText = userMessage;
      if (productUrl) {
        updateProgress('scrape', 'active', 'Attempting to fetch product page...');
        try {
          const scraped = await scrapeProductUrl(productUrl);
          additionalText += `\n\n${scraped.text}`;
        } catch (error) {
          console.warn('URL scraping failed (expected):', error);
        }
      }

      updateProgress('extract', 'active', 'Calling OpenAI API...');

      const extracted = await openai.extractProductData({
        url: productUrl,
        imageUrls: images.map(img => img.dataUrl),
        additionalText,
        customInstructions: aiSettings.customInstructions || [],
        model: aiSettings.model || 'gpt-4o',
        maxTokens: aiSettings.maxTokensPerRequest || 4000,
      });

      updateProgress('extract', 'complete', `Extracted product: ${extracted.title}`);

      // Step 3: Process and upload images
      updateProgress('images', 'active', 'Processing product images...');
      
      const processedImages = await processImages(
        extracted.imageUrls,
        (current, total, status) => {
          updateProgress('images', 'active', `${status} (${current}/${total})`);
        }
      );

      updateProgress('images', 'complete', `Processed ${processedImages.length} images`);

      // Step 4: Suggest category
      updateProgress('category', 'active', 'Analyzing category...');
      
      const categorySuggestion = await suggestCategory(
        {
          title: extracted.title,
          tags: extracted.tags,
          suggestedCategory: extracted.suggestedCategory,
          description: extracted.description,
          specifications: extracted.specifications,
        },
        aiSettings.categoryConfidenceThreshold || 0.7
      );

      updateProgress('category', 'complete', `Suggested: ${categorySuggestion.suggestedName}`);

      // Step 5: Create draft
      updateProgress('draft', 'active', 'Creating product draft...');

      const draftId = await createProductDraft({
        adminId: user!.uid,
        taskId: '', // No task in client-side flow
        status: 'review_required',
        product: {
          name: extracted.title,
          description: extracted.description,
          shortDescription: extracted.shortDescription,
          images: processedImages.map(img => img.storageUrl),
          specs: extracted.specifications,
          tags: extracted.tags,
          price: null, // Always null
          currency: 'INR',
          stockStatus: extracted.stockStatus,
          productType: 'simple',
          videoUrl: extracted.videoUrl,
        },
        suggestedCategory: {
          path: categorySuggestion.suggestedName,
          categoryId: categorySuggestion.categoryId,
          confidence: categorySuggestion.confidence,
          shouldCreate: categorySuggestion.shouldCreate,
          newCategoryDetails: categorySuggestion.shouldCreate ? {
            name: categorySuggestion.suggestedName,
            description: `Category for ${categorySuggestion.suggestedName} products`,
            suggestedImage: processedImages[0]?.storageUrl || '',
          } : undefined,
        },
        aiMetadata: {
          sourceUrl: productUrl,
          model: aiSettings.model || 'gpt-4o',
          extractionMethod: images.length > 0 ? 'vision' : 'manual',
          qualityScore: Math.max(70, Math.min(95, Math.round((1 - extracted.warnings.length * 0.1) * 100))),
          warnings: extracted.warnings,
        },
      });

      updateProgress('draft', 'complete', 'Draft created successfully!');

      // Step 6: Update usage stats
      await updateAIUsage(
        user!.uid,
        aiSettings.model || 'gpt-4o',
        extracted.tokensUsed,
        extracted.cost
      );

      // Step 7: Show success message
      await addAssistantMessage(
        `✅ Product draft created successfully!

**Title**: ${extracted.title}
**Category**: ${categorySuggestion.suggestedName} (${(categorySuggestion.confidence * 100).toFixed(0)}% confidence)
**Images**: ${processedImages.length} processed
**Quality Score**: ${Math.round((1 - extracted.warnings.length * 0.1) * 100)}/100
**Cost**: $${extracted.cost.toFixed(4)} (~₹${(extracted.cost * 83).toFixed(2)})
**Tokens**: ${extracted.tokensUsed.toLocaleString()}

${extracted.warnings.length > 0 ? `⚠️ **Warnings**:\n${extracted.warnings.map(w => `• ${w}`).join('\n')}\n\n` : ''}
Click "Review Draft" to approve and publish!`,
        {
          type: 'draft_created',
          draftId,
        }
      );

      setCurrentDraftId(draftId);
      setProgress([]);

    } catch (error: any) {
      console.error('Product processing error:', error);
      updateProgress('error', 'error', error.message);
      await addAssistantMessage(
        `❌ **Error processing product**\n\n${error.message}\n\nPlease check:\n• Your OpenAI API key is valid\n• You have sufficient API quota\n• The product URL/images are accessible\n• Your internet connection is stable`
      );
      setProgress([]);
    }
  };

  const getHelpResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes('help') || lowerMsg.includes('what can')) {
      return `👋 I'm your AI Product Assistant! Here's what I can do:

**Add Products Automatically**
• Paste a product URL - I'll extract all data
• Upload product screenshots - I'll analyze images
• Automatic description generation
• Smart category suggestions
• Image optimization

**How to Use**
1. Select "Add Product" mode above
2. Paste a product URL or upload screenshots
3. I'll extract: title, description, specs, images
4. Review the draft I create
5. Approve and publish!

**Example Commands**
• "Add this product: https://example.com/product"
• "Create a product from these screenshots" (+ upload images)
• "Help me add an LED light"

**Cost**: ~₹7-15 per product | **Time saved**: 85% vs manual entry

Try it now! Just paste a product URL or upload some screenshots.`;
    }
    
    return `I understand: "${userMessage}"

To add a product, please either:
• **Paste a product URL** - I'll analyze the page
• **Upload screenshots** - I'll extract data from images
• Or ask me "help" for more information

Select "Add Product" mode above and let's get started!`;
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newImages = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (newImages.length === 0) {
      toast.error('Please select valid image files');
      return;
    }
    
    if (uploadedImages.length + newImages.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }
    
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-accent to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group z-50"
        title="AI Product Assistant"
      >
        <Bot className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 w-[480px] h-[680px] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-accent to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="w-6 h-6" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h3 className="font-semibold">AI Product Assistant</h3>
              <p className="text-xs opacity-90">Powered by GPT-4 Vision</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-3 bg-background border-b border-border">
          <select
            value={conversation?.context.mode || 'idle'}
            onChange={async (e) => {
              if (conversation) {
                await updateConversationContext(conversation.id, {
                  mode: e.target.value as any,
                });
                const updated = await getAdminConversation(user!.uid);
                setConversation(updated);
              }
            }}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
            disabled={processing}
          >
            <option value="idle">💬 Chat Mode</option>
            <option value="add_product">✨ Add Product</option>
            <option value="bulk_import">📦 Bulk Import (Coming Soon)</option>
            <option value="update_product">🔄 Update Product (Coming Soon)</option>
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
          {conversation && conversation.messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-accent" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">
                Welcome to AI Assistant!
              </h4>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                I can help you add products automatically by analyzing URLs and images.
              </p>
              <div className="bg-surface rounded-lg border border-border p-4 text-left max-w-sm mx-auto">
                <p className="text-xs font-semibold text-foreground mb-2">Try:</p>
                <p className="text-xs text-muted-foreground mb-1">• Paste a product URL</p>
                <p className="text-xs text-muted-foreground mb-1">• Upload product screenshots</p>
                <p className="text-xs text-muted-foreground">• Ask "help" for more info</p>
              </div>
            </div>
          )}

          {conversation?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-accent text-white'
                    : 'bg-surface border border-border text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.metadata?.draftId && (
                  <button
                    onClick={() => setCurrentDraftId(msg.metadata.draftId)}
                    className="mt-2 px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
                  >
                    Review Draft →
                  </button>
                )}
                <p className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Progress Indicators */}
          {progress.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
              {progress.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  {step.status === 'complete' && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  )}
                  {step.status === 'active' && (
                    <Loader2 className="w-4 h-4 text-blue-accent animate-spin flex-shrink-0" />
                  )}
                  {step.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  )}
                  {step.status === 'pending' && (
                    <div className="w-4 h-4 rounded-full border-2 border-muted flex-shrink-0" />
                  )}
                  <p className="text-sm text-foreground">{step.message}</p>
                </div>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Image Previews */}
        {uploadedImages.length > 0 && (
          <div className="px-4 py-2 bg-background border-t border-border">
            <div className="flex flex-wrap gap-2">
              {uploadedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Upload ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-background border-t border-border">
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className="p-2.5 bg-surface border border-border rounded-lg hover:bg-muted transition-colors text-foreground disabled:opacity-50"
              title="Upload images"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Paste product URL, upload images, or ask questions..."
                rows={1}
                disabled={processing}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent resize-none disabled:opacity-50"
                style={{
                  maxHeight: '120px',
                  minHeight: '42px',
                }}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={processing || (!message.trim() && uploadedImages.length === 0)}
              className="p-2.5 bg-blue-accent text-white rounded-lg hover:bg-blue-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Draft Review Modal */}
      {currentDraftId && (
        <ProductDraftReview
          draftId={currentDraftId}
          onClose={() => setCurrentDraftId(null)}
          onPublished={() => {
            setCurrentDraftId(null);
            toast.success('Product published! Redirecting...');
          }}
        />
      )}
    </>
  );
}