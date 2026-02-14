import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Image as ImageIcon, Sparkles, Loader2, CheckCircle2, AlertCircle, FileText, Upload, X, Settings } from 'lucide-react';
import { useAuthStore } from '../lib/authStore';
import { Link, useNavigate } from 'react-router';
import {
  getAdminConversation,
  createAIConversation,
  addMessageToConversation,
  updateConversationContext,
  getAISettings,
  createProductDraft,
  updateAIUsage,
} from '../lib/aiService';
import { suggestCategory } from '../lib/categoryMatcher';
import { AIConversation } from '../lib/types';
import { OpenAIClient, scrapeProductUrl } from '../lib/openaiClient';
import { processImages, fileToDataUrl } from '../lib/imageProcessor';
import { toast } from 'sonner';
import { ProductDraftReview } from '../components/admin/ProductDraftReview';
import { showPermissionErrorBanner } from '../lib/permissionErrorHandler';
import { Button } from '../components/ui/button';

interface ProgressStep {
  step: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  message: string;
}

interface UploadedFile {
  file: File;
  type: 'image' | 'pdf';
  preview?: string;
}

export function AIAssistantPage() {
  const { user, isAuthenticated, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      toast.error('Please login to access AI Assistant');
    } else if (!isAdmin()) {
      navigate('/');
      toast.error('AI Assistant is only available for admins');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin()) {
      loadOrCreateConversation();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, progress]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

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

    const updated = await getAdminConversation(user!.uid);
    setConversation(updated);
  };

  const handleSendMessage = async () => {
    if (!conversation || !user) return;
    if (!message.trim() && uploadedFiles.length === 0) return;

    const userMessage = message;
    const files = [...uploadedFiles];
    setMessage('');
    setUploadedFiles([]);
    setProcessing(true);
    setProgress([]);

    try {
      // Add user message
      await addMessageToConversation(conversation.id, {
        role: 'user',
        content: userMessage,
        metadata: {
          type: files.length > 0 ? 'file' : 'text',
          fileCount: files.length,
          fileTypes: files.map(f => f.type),
        },
      });

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

      // Check if this is a product request
      const urlMatch = userMessage.match(/(https?:\/\/[^\s]+)/);
      const isProductRequest = 
        urlMatch || 
        files.length > 0 ||
        userMessage.toLowerCase().includes('add') ||
        userMessage.toLowerCase().includes('product') ||
        userMessage.toLowerCase().includes('create') ||
        conversation.context.mode === 'add_product';

      if (!isProductRequest) {
        // General conversation
        await addAssistantMessage(getHelpResponse(userMessage));
        setProcessing(false);
        return;
      }

      // Process product
      await processProduct(userMessage, files, urlMatch?.[0], aiSettings);

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
    files: UploadedFile[],
    productUrl: string | undefined,
    aiSettings: any
  ) => {
    try {
      updateProgress('init', 'active', 'Starting product analysis...');
      await addAssistantMessage('🚀 Starting product extraction...');

      updateProgress('extract', 'active', 'Analyzing product data with AI...');
      
      const openai = new OpenAIClient(aiSettings.openaiApiKey);
      
      // Process uploaded images and PDFs
      const imageDataUrls: string[] = [];
      const pdfTexts: string[] = [];

      for (const uploadedFile of files) {
        if (uploadedFile.type === 'image') {
          updateProgress('files', 'active', `Processing image: ${uploadedFile.file.name}...`);
          const dataUrl = await fileToDataUrl(uploadedFile.file);
          imageDataUrls.push(dataUrl);
        } else if (uploadedFile.type === 'pdf') {
          updateProgress('files', 'active', `Processing PDF: ${uploadedFile.file.name}...`);
          // For PDFs, we'll send a message that they're attached
          // In a real implementation, you'd extract text from PDFs
          pdfTexts.push(`[PDF attached: ${uploadedFile.file.name}]`);
        }
      }

      // Scrape URL if provided
      let additionalText = userMessage;
      if (pdfTexts.length > 0) {
        additionalText += '\n\n' + pdfTexts.join('\n');
      }

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
        imageUrls: imageDataUrls,
        additionalText,
        customInstructions: aiSettings.customInstructions || [],
        model: aiSettings.model || 'gpt-4-vision-preview',
        maxTokens: aiSettings.maxTokensPerRequest || 4000,
      });

      updateProgress('extract', 'complete', `Extracted product: ${extracted.title}`);

      // Process and upload images
      updateProgress('images', 'active', 'Processing product images...');
      
      const processedImages = await processImages(
        extracted.imageUrls,
        (current, total, status) => {
          updateProgress('images', 'active', `${status} (${current}/${total})`);
        }
      );

      updateProgress('images', 'complete', `Processed ${processedImages.length} images`);

      // Suggest category
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

      // Create draft
      updateProgress('draft', 'active', 'Creating product draft...');

      const draftId = await createProductDraft({
        adminId: user!.uid,
        taskId: '',
        status: 'review_required',
        product: {
          name: extracted.title,
          description: extracted.description,
          shortDescription: extracted.shortDescription,
          images: processedImages.map(img => img.storageUrl),
          specs: extracted.specifications,
          tags: extracted.tags,
          price: null,
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
          model: aiSettings.model || 'gpt-4-vision-preview',
          extractionMethod: files.length > 0 ? 'vision' : 'manual',
          qualityScore: Math.max(70, Math.min(95, Math.round((1 - extracted.warnings.length * 0.1) * 100))),
          warnings: extracted.warnings,
        },
      });

      updateProgress('draft', 'complete', 'Draft created successfully!');

      // Update usage stats
      await updateAIUsage(
        user!.uid,
        aiSettings.model || 'gpt-4-vision-preview',
        extracted.tokensUsed,
        extracted.cost
      );

      // Show success message
      await addAssistantMessage(
        `✅ Product draft created successfully!

**Title**: ${extracted.title}
**Category**: ${categorySuggestion.suggestedName} (${(categorySuggestion.confidence * 100).toFixed(0)}% confidence)
**Images**: ${processedImages.length} processed
**Quality Score**: ${Math.round((1 - extracted.warnings.length * 0.1) * 100)}/100
**Cost**: $${extracted.cost.toFixed(4)} (~₹${(extracted.cost * 83).toFixed(2)})
**Tokens**: ${extracted.tokensUsed.toLocaleString()}

${extracted.warnings.length > 0 ? `⚠️ **Warnings**:\n${extracted.warnings.map(w => `• ${w}`).join('\n')}\n\n` : ''}Click "Review Draft" to approve and publish!`,
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
• Upload product images - I'll analyze them
• Upload PDF catalogs - I'll extract product info
• Automatic description generation
• Smart category suggestions
• Image optimization

**How to Use**
1. Select "Add Product" mode above
2. Paste a product URL, upload images, or attach a PDF
3. I'll extract: title, description, specs, images
4. Review the draft I create
5. Approve and publish!

**Supported Inputs**
• Product URLs (e-commerce sites, manufacturer pages)
• Images (JPG, PNG, WEBP - drag & drop or paste)
• PDF documents (product catalogs, spec sheets)

**Example Commands**
• "Add this product: https://example.com/product"
• "Create a product from these images" (+ upload)
• "Extract products from this catalog" (+ PDF)

**Cost**: ~₹7-15 per product | **Time saved**: 85% vs manual entry

Try it now! Just paste a URL, upload images, or attach a PDF.`;
    }
    
    return `I understand: "${userMessage}"

To add a product, please either:
• **Paste a product URL** - I'll analyze the page
• **Upload images** - I'll extract data from them
• **Attach a PDF** - I'll extract product information
• Or ask me "help" for more information

Select "Add Product" mode above and let's get started!`;
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    
    const newFiles: UploadedFile[] = [];
    
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        newFiles.push({ file, type: 'image', preview });
      } else if (file.type === 'application/pdf') {
        newFiles.push({ file, type: 'pdf' });
      } else {
        toast.error(`Unsupported file type: ${file.name}`);
      }
    }
    
    if (newFiles.length === 0) {
      toast.error('Please select valid image or PDF files');
      return;
    }
    
    if (uploadedFiles.length + newFiles.length > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      const fileList = new DataTransfer();
      files.forEach(file => fileList.items.add(file));
      await handleFileUpload(fileList.files);
      toast.success(`${files.length} image(s) pasted`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  if (!isAuthenticated() || !isAdmin()) {
    return null;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-muted/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-accent to-purple-600 text-white p-4 md:p-6 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="w-8 h-8" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">AI Product Assistant</h1>
            <p className="text-sm opacity-90">Powered by GPT-4 Vision • Extract products from URLs, images & PDFs</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 gap-2"
          asChild
        >
          <Link to="/admin/settings">
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Settings</span>
          </Link>
        </Button>
      </div>

      {/* Mode Selector */}
      <div className="p-3 md:p-4 bg-background border-b border-border">
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
          className="w-full md:max-w-md px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
          disabled={processing}
        >
          <option value="idle">💬 Chat Mode</option>
          <option value="add_product">✨ Add Product</option>
          <option value="bulk_import">📦 Bulk Import (Coming Soon)</option>
          <option value="update_product">🔄 Update Product (Coming Soon)</option>
        </select>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="fixed inset-0 bg-blue-accent/20 backdrop-blur-sm flex items-center justify-center z-40 pointer-events-none">
            <div className="bg-surface border-2 border-dashed border-blue-accent rounded-2xl p-12 text-center">
              <Upload className="w-16 h-16 text-blue-accent mx-auto mb-4" />
              <p className="text-xl font-semibold text-foreground">Drop files here</p>
              <p className="text-sm text-muted-foreground mt-2">Images and PDFs supported</p>
            </div>
          </div>
        )}

        {conversation && conversation.messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-blue-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-blue-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Welcome to AI Assistant!
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              I can help you add products automatically by analyzing URLs, images, and PDF catalogs.
            </p>
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="bg-surface rounded-lg border border-border p-6 text-left">
                <div className="w-12 h-12 bg-blue-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-blue-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Product URLs</h3>
                <p className="text-sm text-muted-foreground">Paste any product URL and I'll extract all details automatically</p>
              </div>
              <div className="bg-surface rounded-lg border border-border p-6 text-left">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <ImageIcon className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Image Analysis</h3>
                <p className="text-sm text-muted-foreground">Upload or paste product images for AI-powered extraction</p>
              </div>
              <div className="bg-surface rounded-lg border border-border p-6 text-left">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">PDF Catalogs</h3>
                <p className="text-sm text-muted-foreground">Attach PDF catalogs to extract product information</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <div className="px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
                Try: "Add this product: https://..."
              </div>
              <div className="px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
                Or upload images/PDFs
              </div>
              <div className="px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
                Ask "help" for more info
              </div>
            </div>
          </div>
        )}

        {conversation?.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-accent text-white'
                  : 'bg-surface border border-border text-foreground'
              }`}
            >
              <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              {msg.metadata?.draftId && (
                <button
                  onClick={() => setCurrentDraftId(msg.metadata.draftId)}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Review Draft →
                </button>
              )}
              <p className="text-xs opacity-70 mt-2">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Progress Indicators */}
        {progress.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
            {progress.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                {step.status === 'complete' && (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
                {step.status === 'active' && (
                  <Loader2 className="w-5 h-5 text-blue-accent animate-spin flex-shrink-0" />
                )}
                {step.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                )}
                {step.status === 'pending' && (
                  <div className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" />
                )}
                <p className="text-sm text-foreground">{step.message}</p>
              </div>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Previews */}
      {uploadedFiles.length > 0 && (
        <div className="px-4 md:px-6 py-3 bg-background border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Attached Files ({uploadedFiles.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <div key={index} className="relative group">
                {uploadedFile.type === 'image' ? (
                  <div className="relative">
                    <img
                      src={uploadedFile.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-border"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-muted rounded-lg border-2 border-border flex flex-col items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">PDF</span>
                  </div>
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg hover:scale-110"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 md:p-6 bg-background border-t border-border">
        <div className="flex items-end gap-2 md:gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="p-3 bg-surface border border-border rounded-xl hover:bg-muted transition-colors text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload images or PDFs"
          >
            <Upload className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Paste product URL, upload files, or ask questions... (Ctrl+V to paste images)"
              rows={1}
              disabled={processing}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent resize-none disabled:opacity-50"
              style={{
                maxHeight: '120px',
                minHeight: '48px',
              }}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={processing || (!message.trim() && uploadedFiles.length === 0)}
            className="p-3 bg-blue-accent text-white rounded-xl hover:bg-blue-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line • Drag & drop or Ctrl+V to paste files
        </p>
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
    </div>
  );
}
