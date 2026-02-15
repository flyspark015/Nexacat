import { useState, useEffect, useRef } from 'react';
import { Bot, Send, ImageIcon, Loader2, Upload, X, Settings as SettingsIcon, Paperclip, FileText, Trash2 } from 'lucide-react';
import { useAuthStore } from '../lib/authStore';
import { useNavigate, Link } from 'react-router';
import {
  getAdminConversation,
  createAIConversation,
  addMessageToConversation,
  getAISettings,
  createProductDraft,
  updateAIUsage,
  clearConversationMessages,
} from '../lib/aiService';
import { AIConversation } from '../lib/types';
import { OpenAIClient } from '../lib/openaiClient';
import { processImages, fileToDataUrl } from '../lib/imageProcessor';
import { renderProductPage } from '../lib/pageRenderer';
import { processProductHTML, ExtractedImage } from '../lib/htmlProcessor';
import { toast } from 'sonner';
import { ProductDraftReview } from '../components/admin/ProductDraftReview';
import { showPermissionErrorBanner } from '../lib/permissionErrorHandler';
import { Button } from '../components/ui/button';
import { EnhancedProgressHeader, ProgressCheckpoint } from '../components/admin/EnhancedProgressHeader';
import { 
  detectIntent, 
  generateAgenticResponse, 
  generateWelcomeMessage,
  ConversationContext 
} from '../lib/agenticAI';
import { getModelRecommendation, estimateTokenRequirement } from '../lib/modelRouter';
import { suggestCategory } from '../lib/categoryMatcher';
import { motion, AnimatePresence } from 'motion/react';
import { ImageSelector, ImageCandidate } from '../components/admin/ImageSelector';
import { HTMLPreviewModal } from '../components/admin/HTMLPreviewModal';

interface UploadedFile {
  file: File;
  type: 'image' | 'pdf';
  preview?: string;
}

interface ImageSelectionState {
  show: boolean;
  images: ImageCandidate[];
  onConfirm: (selectedUrls: string[]) => void;
}

interface HTMLPreviewState {
  show: boolean;
  html: string;
  url: string;
}

export function AIAssistantPage() {
  const { user, isAuthenticated, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [checkpoints, setCheckpoints] = useState<ProgressCheckpoint[]>([]);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [currentStepLabel, setCurrentStepLabel] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [imageSelection, setImageSelection] = useState<ImageSelectionState>({
    show: false,
    images: [],
    onConfirm: () => {},
  });
  const [htmlPreview, setHtmlPreview] = useState<HTMLPreviewState>({
    show: false,
    html: '',
    url: '',
  });
  
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

  // Load conversation and check API key
  useEffect(() => {
    if (user && isAdmin()) {
      loadOrCreateConversation();
      checkApiKey();
    }
  }, [user, isAdmin]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, showProgress]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [message]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkApiKey = async () => {
    try {
      if (!user) return;
      const settings = await getAISettings(user.uid);
      setHasApiKey(!!settings?.openaiApiKey);
    } catch (error) {
      console.error('Error checking API key:', error);
    }
  };

  const loadOrCreateConversation = async () => {
    if (!user) return;

    try {
      let conv = await getAdminConversation(user.uid);
      
      if (!conv) {
        const convId = await createAIConversation(user.uid);
        conv = await getAdminConversation(user.uid);
        
        // Add welcome message
        if (conv) {
          const welcomeMsg = generateWelcomeMessage({
            userName: user.displayName?.split(' ')[0],
            isFirstVisit: true,
            hasApiKey,
          });
          
          await addMessageToConversation(conv.id, {
            role: 'assistant',
            content: welcomeMsg,
            timestamp: new Date().toISOString(),
          });
          
          conv = await getAdminConversation(user.uid);
        }
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

  const getConversationContext = (): ConversationContext => {
    return {
      recentMessages: (conversation?.messages || []).slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      })),
      uploadedFiles: uploadedFiles.map(f => ({
        type: f.type,
        name: f.file.name,
      })),
      currentTask: processing ? 'product_creation' : undefined,
      productDraftInProgress: !!currentDraftId,
    };
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && uploadedFiles.length === 0) || !conversation || processing) {
      return;
    }

    const userMessage = message.trim();
    const files = [...uploadedFiles];
    
    // Clear input immediately
    setMessage('');
    setUploadedFiles([]);

    // Add user message to UI
    await addAssistantMessage(userMessage, 'user');

    // Detect intent using agentic AI
    const context = getConversationContext();
    const intent = detectIntent(userMessage, context);

    console.log('🤖 Detected Intent:', intent);

    // Handle based on intent
    if (intent.type === 'product_creation' && intent.suggestedAction === 'start_extraction') {
      // Start product extraction
      await handleProductExtraction(userMessage, files, intent);
    } else {
      // Generate conversational response
      const response = generateAgenticResponse(intent, userMessage, context);
      
      if (response) {
        await addAssistantMessage(response);
      } else {
        // Check if user wants to proceed with uploaded files
        if (files.length > 0) {
          await addAssistantMessage(
            `Perfect! I'll analyze your ${files.length} file(s) and create a product. This will take a moment...`
          );
          await handleProductExtraction('', files, intent);
        }
      }
    }
  };

  const handleProductExtraction = async (
    userMessage: string,
    files: UploadedFile[],
    intent: any
  ) => {
    // Check API key directly before proceeding
    try {
      const settings = await getAISettings(user!.uid);
      if (!settings?.openaiApiKey) {
        await addAssistantMessage(
          '⚠️ **OpenAI API key required**\n\nPlease add your API key in Settings first. Click the Settings button at the top of this page.'
        );
        return;
      }
    } catch (error) {
      console.error('Error checking API key:', error);
      await addAssistantMessage(
        '❌ **Error checking API key**\n\nPlease try again or check your settings.'
      );
      return;
    }

    setProcessing(true);
    setShowProgress(true);

    // Initialize progress checkpoints
    const steps: ProgressCheckpoint[] = [
      { id: '1', label: 'Source', icon: '🔗', status: 'pending' },
      { id: '2', label: 'Extract', icon: '📥', status: 'pending' },
      { id: '3', label: 'Parse', icon: '🧠', status: 'pending' },
      { id: '4', label: 'Images', icon: '🖼️', status: 'pending' },
      { id: '5', label: 'Category', icon: '🏷️', status: 'pending' },
      { id: '6', label: 'Draft', icon: '📝', status: 'pending' },
      { id: '7', label: 'Ready', icon: '✅', status: 'pending' },
    ];

    setCheckpoints(steps);
    setProgressPercentage(0);

    try {
      const settings = await getAISettings(user.uid);
      if (!settings?.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const openai = new OpenAIClient(settings.openaiApiKey);

      // Extract URL if present
      const extractedUrl = intent.extractedData?.url || userMessage.match(/(https?:\/\/[^\\s]+)/)?.[0];

      // Step 1: Source Detection
      updateCheckpoint(0, 'active', 'Detecting source...');
      setProgressPercentage(5);
      
      let finalUrl = extractedUrl;
      
      if (extractedUrl) {
        await addAssistantMessage(`🔗 Analyzing URL: ${extractedUrl}`);
      }
      
      updateCheckpoint(0, 'complete');
      setProgressPercentage(15);

      // Step 2: Extract Data
      updateCheckpoint(1, 'active', 'Extracting...');
      
      let imageDataUrls: string[] = [];
      let extractedProductImages: ExtractedImage[] = [];
      let renderedHTML = '';
      
      // Convert uploaded files to data URLs
      const imageFiles = files.filter(f => f.type === 'image');
      if (imageFiles.length > 0) {
        await addAssistantMessage(`Processing ${imageFiles.length} uploaded images...`);
        
        for (const file of imageFiles) {
          try {
            const dataUrl = await fileToDataUrl(file.file);
            imageDataUrls.push(dataUrl);
          } catch (error) {
            console.error('Failed to process image:', error);
          }
        }
      }
      
      // If URL provided, perform full page rendering and HTML extraction
      if (finalUrl) {
        try {
          await addAssistantMessage(`📡 Attempting to fetch page content...`);
          
          // Full page render
          const rendered = await renderProductPage(finalUrl, (progress) => {
            // Update progress without referencing rendered (which doesn't exist yet)
            if (progress.message) {
              setCurrentStepLabel(progress.message);
            }
          });
          
          renderedHTML = rendered.html;
          
          await addAssistantMessage(
            `✅ Page rendered successfully\n` +
            `• **HTML Size**: ${(rendered.html.length / 1024).toFixed(1)} KB\n` +
            `• **Render Time**: ${(rendered.renderTime / 1000).toFixed(2)}s`
          );
          
          // Process HTML to extract product data
          await addAssistantMessage(`🔍 Analyzing HTML structure...`);
          
          const processed = processProductHTML(rendered.html, finalUrl);
          
          // Show extracted metadata
          if (processed.metadata.title) {
            await addAssistantMessage(
              `📋 **Extracted Metadata:**\n` +
              `• Title: ${processed.metadata.title}\n` +
              (processed.metadata.price ? `• Price: ${processed.metadata.price} ${processed.metadata.currency || ''}\n` : '') +
              (processed.metadata.brand ? `• Brand: ${processed.metadata.brand}\n` : '')
            );
          }
          
          // Show structured data if found
          if (processed.structuredData) {
            await addAssistantMessage(
              `✅ Found structured data (JSON-LD):\n\`\`\`json\n${JSON.stringify(processed.structuredData, null, 2).slice(0, 500)}...\n\`\`\``
            );
          }
          
          // Extract and display image URLs step-by-step
          extractedProductImages = processed.productImages;
          
          if (extractedProductImages.length > 0) {
            await addAssistantMessage(
              `🖼️ **Image Extraction Progress:**\n` +
              `✅ Found gallery container\n` +
              `✅ Extracted ${extractedProductImages.length} candidate image URLs\n` +
              `🟡 Filtering thumbnails and non-product images...`
            );
            
            // Show breakdown by source
            const bySource = extractedProductImages.reduce((acc, img) => {
              acc[img.source] = (acc[img.source] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            const sourceBreakdown = Object.entries(bySource)
              .map(([source, count]) => `• ${source.toUpperCase()}: ${count} images`)
              .join('\n');
            
            await addAssistantMessage(
              `✅ **Image sources:**\n${sourceBreakdown}\n\n` +
              `🎯 Selected ${extractedProductImages.filter(img => img.type === 'main' || img.type === 'gallery').length} high-quality product images`
            );
            
            // Show cleaned HTML sections (first 1000 chars)
            const cleanedSnippet = processed.cleanedHtml.slice(0, 1000);
            await addAssistantMessage(
              `📄 **Cleaned HTML Preview:**\n\`\`\`html\n${cleanedSnippet}...\n\`\`\``
            );
          } else {
            await addAssistantMessage(
              `⚠️ No product images found in HTML. The page may require authentication or use non-standard image loading.`
            );
          }
          
        } catch (renderError: any) {
          console.error('Page rendering failed:', renderError);
          await addAssistantMessage(
            `ℹ️ **Unable to automatically fetch page**\n\n` +
            `The page couldn't be fetched automatically. This is normal for pages that:\n` +
            `• Require login/authentication\n` +
            `• Block automated access\n` +
            `• Use JavaScript-heavy content\n\n` +
            `**No problem!** You can:\n` +
            `1. Take screenshots of the product page\n` +
            `2. Copy-paste product details directly\n` +
            `3. Just describe the product to me\n\n` +
            `I'll help you create the product listing either way! 🚀`
          );
        }
      }
      
      updateCheckpoint(1, 'complete');
      setProgressPercentage(30);

      // Step 3: Parse with AI
      updateCheckpoint(2, 'active', 'Parsing...');
      
      const productData = await openai.extractProductData({
        url: finalUrl,
        imageUrls: imageDataUrls,
        additionalText: userMessage,
        customInstructions: settings.customInstructions,
        model: settings.model || 'gpt-5.2', // Use strongest model
        maxTokens: settings.maxTokensPerRequest || 8000,
      });

      await addAssistantMessage(
        `✅ Extracted product data:\\n**${productData.title}**\\n\\n*Processing images and finalizing details...*`
      );
      
      // If HTML was fetched, store it for preview
      if (productData.fetchedHtml && productData.fetchedHtmlUrl) {
        setHtmlPreview({
          show: false,
          html: productData.fetchedHtml,
          url: productData.fetchedHtmlUrl,
        });
        
        await addAssistantMessage(
          `📄 **Page HTML captured** (${(productData.fetchedHtml.length / 1024).toFixed(1)} KB)\\n\\n` +
          `[Click to view rendered page](#view-html)`
        );
      }
      
      updateCheckpoint(2, 'complete');
      setProgressPercentage(50);

      // Step 4: Process Images
      updateCheckpoint(3, 'active', 'Images...');
      
      const allImageUrls = productData.imageUrls;
      
      if (allImageUrls.length > 0) {
        const imagesToProcess = allImageUrls.slice(0, 12); // Max 12 images for selection
        
        // Prepare image candidates
        const candidates: ImageCandidate[] = imagesToProcess.map((url, index) => ({
          url,
          source: 'extracted',
          index,
        }));
        
        await addAssistantMessage(
          `📸 Found ${candidates.length} product images. Please select which ones to include in the listing.`
        );
        
        // Show image selector and wait for confirmation
        const selectedUrls = await new Promise<string[]>((resolve) => {
          setImageSelection({
            show: true,
            images: candidates,
            onConfirm: (urls) => {
              setImageSelection({ show: false, images: [], onConfirm: () => {} });
              resolve(urls);
            },
          });
        });
        
        if (selectedUrls.length === 0) {
          throw new Error('No images selected. Please select at least one image to continue.');
        }
        
        await addAssistantMessage(`✅ Selected ${selectedUrls.length} images. Processing...`);
        
        // Process only selected images
        const processedImages = await processImages(selectedUrls, (current, total, status) => {
          setCurrentStepLabel(`Image ${current}/${total}`);
        });
        
        updateCheckpoint(3, 'complete');
        setProgressPercentage(70);
        
        // Continue with the rest of the flow...
        await continueProductCreation(
          productData,
          processedImages,
          finalUrl,
          imageDataUrls,
          settings
        );
      } else {
        // No images found, continue without images
        updateCheckpoint(3, 'complete');
        setProgressPercentage(70);
        
        await continueProductCreation(
          productData,
          [],
          finalUrl,
          imageDataUrls,
          settings
        );
      }

    } catch (error: any) {
      console.error('Product extraction error:', error);
      
      // Mark current step as error
      const activeIndex = checkpoints.findIndex(cp => cp.status === 'active');
      if (activeIndex >= 0) {
        updateCheckpoint(activeIndex, 'error', 'Failed');
      }
      
      await addAssistantMessage(
        `❌ **Something went wrong**\n\n${error.message}\n\nPlease check:\n• Your API key is valid\n• You have sufficient quota\n• The URL/images are accessible\n\nTry again or ask me for help!`
      );
      
      setTimeout(() => {
        setShowProgress(false);
        setCheckpoints([]);
      }, 3000);
    } finally {
      setProcessing(false);
    }
  };

  const continueProductCreation = async (
    productData: any,
    processedImages: any[],
    finalUrl: string | undefined,
    imageDataUrls: string[],
    settings: any
  ) => {
    try {
      // Step 5: Suggest Category
      updateCheckpoint(4, 'active', 'Category...');
      
      const categorySuggestion = await suggestCategory(
        {
          title: productData.title,
          tags: productData.tags || [],
          suggestedCategory: productData.suggestedCategory || 'General',
          description: productData.description || '',
          specifications: productData.specifications || {},
        }
      );
      
      updateCheckpoint(4, 'complete');
      setProgressPercentage(85);

      // Step 6: Create Draft
      updateCheckpoint(5, 'active', 'Draft...');
      
      const draftId = await createProductDraft({
        adminId: user!.uid,
        taskId: `task_${Date.now()}`,
        status: 'review_required',
        product: {
          name: productData.title,
          description: productData.description,
          shortDescription: [productData.shortDescription || ''],
          images: processedImages.map(img => img.storageUrl),
          specs: productData.specifications || {},
          tags: productData.tags || [],
          currency: 'INR',
          stockStatus: productData.stockStatus || 'in-stock',
          productType: 'simple',
          ...(productData.videoUrl && { videoUrl: productData.videoUrl }),
        },
        suggestedCategory: {
          path: categorySuggestion.categoryId || categorySuggestion.suggestedName,
          ...(categorySuggestion.categoryId && { categoryId: categorySuggestion.categoryId }),
          confidence: categorySuggestion.confidence,
          shouldCreate: categorySuggestion.shouldCreate,
        },
        aiMetadata: {
          sourceUrl: finalUrl,
          model: settings.model || 'gpt-5.2',
          tokensUsed: productData.tokensUsed || 0,
          cost: productData.cost || 0,
          extractionMethod: imageDataUrls.length > 0 ? 'vision' : 'url',
          qualityScore: 85,
          warnings: productData.warnings || [],
        },
      });

      // Track usage
      await updateAIUsage(
        user!.uid,
        settings.model || 'gpt-5.2',
        productData.tokensUsed || 0,
        productData.cost || 0
      );

      updateCheckpoint(5, 'complete');
      setProgressPercentage(95);

      // Step 7: Complete
      updateCheckpoint(6, 'active', 'Finalizing...');
      
      setCurrentDraftId(draftId);
      
      await addAssistantMessage(
        `🎉 **Product draft ready!**\n\nI've created a complete draft for **${productData.title}**. Please review it below and publish when ready.`
      );
      
      updateCheckpoint(6, 'complete');
      setProgressPercentage(100);
      
      // Hide progress after a moment
      setTimeout(() => {
        setShowProgress(false);
        setCheckpoints([]);
      }, 2000);

    } catch (error: any) {
      console.error('Product extraction error:', error);
      
      // Mark current step as error
      const activeIndex = checkpoints.findIndex(cp => cp.status === 'active');
      if (activeIndex >= 0) {
        updateCheckpoint(activeIndex, 'error', 'Failed');
      }
      
      await addAssistantMessage(
        `❌ **Something went wrong**\n\n${error.message}\n\nPlease check:\n• Your API key is valid\n• You have sufficient quota\n• The URL/images are accessible\n\nTry again or ask me for help!`
      );
      
      setTimeout(() => {
        setShowProgress(false);
        setCheckpoints([]);
      }, 3000);
    } finally {
      setProcessing(false);
    }
  };

  const updateCheckpoint = (index: number, status: ProgressCheckpoint['status'], label?: string) => {
    setCheckpoints(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], status };
        if (label) {
          setCurrentStepLabel(label);
        } else {
          setCurrentStepLabel(updated[index].label);
        }
      }
      return updated;
    });
  };

  const addAssistantMessage = async (content: string, role: 'assistant' | 'user' = 'assistant') => {
    if (!conversation) return;

    const newMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    await addMessageToConversation(conversation.id, newMessage);
    
    // Reload conversation
    const updated = await getAdminConversation(user!.uid);
    if (updated) {
      setConversation(updated);
    }
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
        toast.error(`Unsupported file: ${file.name}`);
      }
    }
    
    if (newFiles.length === 0) return;
    
    if (uploadedFiles.length + newFiles.length > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} file(s) added`);
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
      const dataTransfer = new DataTransfer();
      files.forEach(file => dataTransfer.items.add(file));
      handleFileUpload(dataTransfer.files);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const updated = [...prev];
      if (updated[index]?.preview) {
        URL.revokeObjectURL(updated[index].preview!);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = async () => {
    if (!conversation) return;
    
    const confirm = window.confirm('Are you sure you want to clear the conversation? This action cannot be undone.');
    if (!confirm) return;
    
    try {
      await clearConversationMessages(conversation.id);
      const updated = await getAdminConversation(user!.uid);
      if (updated) {
        setConversation(updated);
      }
      toast.success('Conversation cleared successfully!');
    } catch (error) {
      console.error('Error clearing conversation:', error);
      toast.error('Failed to clear conversation');
    }
  };

  if (!isAdmin() || !isAuthenticated()) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Enhanced Progress Header */}
      <EnhancedProgressHeader
        checkpoints={checkpoints}
        currentStepLabel={currentStepLabel}
        percentage={progressPercentage}
        show={showProgress}
      />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-accent to-purple-500">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Product Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Conversational product management
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearConversation}
              disabled={!conversation || conversation.messages.length === 0 || processing}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
            <Link to="/admin/settings">
              <Button variant="outline" size="sm">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {conversation?.messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-accent text-white'
                    : 'bg-muted text-foreground'
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {msg.content.split('\n').map((line, i) => {
                    // Parse markdown-style bold
                    const parts = line.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <p key={i} className="mb-2 last:mb-0">
                        {parts.map((part, j) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j}>{part.slice(2, -2)}</strong>;
                          }
                          return <span key={j}>{part}</span>;
                        })}
                      </p>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Image Selection UI */}
          {imageSelection.show && (
            <div className="my-6">
              <ImageSelector
                images={imageSelection.images}
                onConfirm={imageSelection.onConfirm}
                onCancel={() => {
                  setImageSelection({ show: false, images: [], onConfirm: () => {} });
                  setProcessing(false);
                  setShowProgress(false);
                  addAssistantMessage('Image selection cancelled. Feel free to try again with different criteria!');
                }}
              />
            </div>
          )}

          {/* Product Draft Review */}
          {currentDraftId && (
            <div className="my-6">
              <ProductDraftReview
                draftId={currentDraftId}
                onClose={() => setCurrentDraftId(null)}
                onPublished={() => {
                  setCurrentDraftId(null);
                  addAssistantMessage('🎉 Product published successfully! Ready to add another one?');
                }}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Uploaded Files Preview */}
          <AnimatePresence>
            {uploadedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 flex flex-wrap gap-2"
              >
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg border border-border p-2 bg-muted"
                  >
                    {file.type === 'image' && file.preview ? (
                      <img
                        src={file.preview}
                        alt="Upload preview"
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center bg-background rounded">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Box */}
          <div
            className={`relative rounded-2xl border-2 transition-colors ${
              isDragging
                ? 'border-blue-accent bg-blue-accent/5'
                : 'border-border bg-background'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
          >
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message, paste a URL, or drag & drop files..."
              className="w-full px-4 py-3 bg-transparent border-none outline-none resize-none min-h-[60px] max-h-[150px]"
              disabled={processing}
            />
            
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={processing || (!message.trim() && uploadedFiles.length === 0)}
                size="sm"
                className="bg-blue-accent hover:bg-blue-accent/90"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send • Shift+Enter for new line • Drag & drop files anywhere
          </p>
        </div>
      </div>
    </div>
  );
}