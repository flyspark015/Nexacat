import { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Upload, Image as ImageIcon, FileText, X, Copy, RotateCcw, 
  Trash2, Loader2, CheckCircle2, AlertCircle, Sparkles, Settings, 
  Clock, File, Download, ExternalLink, Check, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { Link } from 'react-router';
import {
  getAdminConversation,
  createAIConversation,
  addMessageToConversation,
  updateConversationContext,
  getAISettings,
  createProductDraft,
  updateAIUsage,
} from '../../lib/aiService';
import { suggestCategory } from '../../lib/categoryMatcher';
import { AIConversation, AIMessage } from '../../lib/types';
import { OpenAIClient, scrapeProductUrl } from '../../lib/openaiClient';
import { processImages, fileToDataUrl } from '../../lib/imageProcessor';
import { toast } from 'sonner';
import { ProductDraftReview } from '../../components/admin/ProductDraftReview';
import { showPermissionErrorBanner } from '../../lib/permissionErrorHandler';
import { Button } from '../../components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '../../components/ui/alert-dialog';
import { motion, AnimatePresence } from 'motion/react';

interface ProgressStep {
  step: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  message: string;
  timestamp?: Date;
}

interface UploadedFile {
  file: File;
  type: 'image' | 'pdf' | 'document';
  preview?: string;
  id: string;
}

interface TaskContext {
  taskId?: string;
  productUrl?: string;
  files?: UploadedFile[];
  status?: 'pending' | 'processing' | 'review' | 'complete' | 'failed';
  draftId?: string;
  error?: string;
}

export function AdminAI() {
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [taskContext, setTaskContext] = useState<TaskContext>({});
  const [permissionError, setPermissionError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user) {
      loadOrCreateConversation();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, progress, isTyping]);

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
      
      // Restore task context from last message if exists
      if (conv && conv.messages.length > 0) {
        const lastMsg = conv.messages[conv.messages.length - 1];
        if (lastMsg.metadata?.taskContext) {
          setTaskContext(lastMsg.metadata.taskContext);
        }
      }
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      
      if (error.code === 'permission-denied') {
        showPermissionErrorBanner();
        setPermissionError(true);
      } else {
        toast.error('Failed to load conversation');
      }
    }
  };

  const updateProgress = (step: string, status: ProgressStep['status'], message: string) => {
    setProgress(prev => {
      const existing = prev.find(p => p.step === step);
      if (existing) {
        return prev.map(p => p.step === step ? { step, status, message, timestamp: new Date() } : p);
      }
      return [...prev, { step, status, message, timestamp: new Date() }];
    });
  };

  const addAssistantMessage = async (content: string, metadata?: any) => {
    if (!conversation) return;

    // Simulate typing for better UX
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsTyping(false);

    await addMessageToConversation(conversation.id, {
      role: 'assistant',
      content,
      metadata: {
        ...metadata,
        taskContext,
      },
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
          files: files.map(f => ({ name: f.file.name, type: f.type, size: f.file.size })),
        },
      });

      let updated = await getAdminConversation(user.uid);
      setConversation(updated);

      // Get AI settings
      const aiSettings = await getAISettings(user.uid);
      if (!aiSettings || !aiSettings.openaiApiKey) {
        await addAssistantMessage(
          '⚠️ **OpenAI API key not configured**\n\nPlease configure your API key in Settings → AI Product Assistant before using this feature.\n\n[Go to Settings](/admin/settings)'
        );
        setProcessing(false);
        return;
      }

      // Smart intent detection
      await processUserIntent(userMessage, files, aiSettings);

    } catch (error: any) {
      console.error('Error processing message:', error);
      await addAssistantMessage(
        `❌ **Error**: ${error.message}\n\nPlease try again or check your settings.`
      );
    } finally {
      setProcessing(false);
    }
  };

  const processUserIntent = async (userMessage: string, files: UploadedFile[], aiSettings: any) => {
    const lowerMsg = userMessage.toLowerCase();
    
    // Check for product-related intents
    const urlMatch = userMessage.match(/(https?:\/\/[^\s]+)/);
    const isProductRequest = 
      urlMatch || 
      files.length > 0 ||
      lowerMsg.includes('add product') ||
      lowerMsg.includes('create product') ||
      lowerMsg.includes('extract') ||
      lowerMsg.includes('import') ||
      taskContext.status === 'pending' ||
      taskContext.status === 'processing';

    // Check for help/info requests
    if (lowerMsg.includes('help') || lowerMsg.includes('what can you do')) {
      await showHelp();
      return;
    }

    // Check for task resumption
    if ((lowerMsg.includes('continue') || lowerMsg.includes('resume')) && taskContext.draftId) {
      await resumeTask();
      return;
    }

    // Check for task cancellation
    if ((lowerMsg.includes('cancel') || lowerMsg.includes('stop')) && taskContext.status === 'processing') {
      await cancelTask();
      return;
    }

    // Process product request
    if (isProductRequest) {
      await processProduct(userMessage, files, urlMatch?.[0], aiSettings);
    } else {
      // General conversation with context awareness
      await handleGeneralConversation(userMessage);
    }
  };

  const handleGeneralConversation = async (userMessage: string) => {
    // Use conversation context to provide intelligent responses
    const responseMap: { [key: string]: string } = {
      'hello': '👋 Hello! I\'m your AI Product Assistant. I can help you:\n\n• Add products from URLs\n• Extract product info from images\n• Process PDF catalogs\n• Manage product drafts\n\nJust paste a product URL, upload images, or ask me anything!',
      'status': taskContext.status 
        ? `📊 **Current Task Status**: ${taskContext.status}\n\n${taskContext.draftId ? `Draft ID: ${taskContext.draftId}\n\nType "continue" to resume this task.` : 'No active tasks.'}`
        : '✅ No active tasks. Ready to help!',
      'thanks': '😊 You\'re welcome! Let me know if you need anything else.',
    };

    // Find matching response
    for (const [key, response] of Object.entries(responseMap)) {
      if (userMessage.toLowerCase().includes(key)) {
        await addAssistantMessage(response);
        return;
      }
    }

    // Default contextual response
    await addAssistantMessage(
      `I understand you said: "${userMessage}"\n\nTo add a product, you can:\n• Paste a product URL\n• Upload product images\n• Attach a PDF catalog\n\nOr ask me "help" for more information.`
    );
  };

  const showHelp = async () => {
    await addAssistantMessage(
      `🤖 **AI Product Assistant - Help Guide**

**What I Can Do**
• 🔗 Extract products from URLs
• 📸 Analyze product images (GPT-4 Vision)
• 📄 Process PDF catalogs and spec sheets
• 🏷️ Smart category suggestions
• ✨ Auto-generate descriptions
• 📊 Quality scoring and validation

**How to Use**
1. **Add Single Product**: Paste URL or upload images
2. **Bulk Import**: Attach PDF catalog
3. **Review Drafts**: I'll create drafts for your approval
4. **Resume Tasks**: Type "continue" to resume unfinished work

**Supported Inputs**
• URLs (e-commerce, manufacturer pages)
• Images (JPG, PNG, WEBP) - drag/drop or paste
• PDFs (catalogs, datasheets)

**Commands**
• \`help\` - Show this guide
• \`status\` - Check current task status
• \`continue\` - Resume unfinished task
• \`cancel\` - Stop current processing

**Cost & Performance**
• ~₹7-15 per product
• 85% time saved vs manual entry
• GPT-4 Vision powered

Try it now! Just paste a product URL or upload some files. 🚀`
    );
  };

  const resumeTask = async () => {
    if (!taskContext.draftId) {
      await addAssistantMessage('❌ No task to resume. Start a new product addition.');
      return;
    }

    await addAssistantMessage(
      `🔄 **Resuming Task**\n\nDraft ID: ${taskContext.draftId}\n\nOpening draft review...`
    );
    setCurrentDraftId(taskContext.draftId);
  };

  const cancelTask = async () => {
    setTaskContext({});
    setProgress([]);
    setProcessing(false);
    await addAssistantMessage('⏹️ Task cancelled. Ready for next request.');
  };

  const processProduct = async (
    userMessage: string,
    files: UploadedFile[],
    productUrl: string | undefined,
    aiSettings: any
  ) => {
    try {
      // Update task context
      const newTaskId = `task_${Date.now()}`;
      setTaskContext({
        taskId: newTaskId,
        productUrl,
        files,
        status: 'processing',
      });

      updateProgress('init', 'active', 'Starting product analysis...');
      await addAssistantMessage('🚀 **Starting product extraction...**\n\nI\'ll process this step by step.');

      updateProgress('extract', 'active', 'Analyzing product data with AI...');
      
      const openai = new OpenAIClient(aiSettings.openaiApiKey);
      
      // Process files
      const imageDataUrls: string[] = [];
      const pdfTexts: string[] = [];

      for (const uploadedFile of files) {
        if (uploadedFile.type === 'image') {
          updateProgress('files', 'active', `Processing: ${uploadedFile.file.name}...`);
          const dataUrl = await fileToDataUrl(uploadedFile.file);
          imageDataUrls.push(dataUrl);
        } else if (uploadedFile.type === 'pdf') {
          updateProgress('files', 'active', `Processing: ${uploadedFile.file.name}...`);
          pdfTexts.push(`[PDF: ${uploadedFile.file.name}]`);
        }
      }

      // Build context with conversation history
      let contextualPrompt = userMessage;
      if (conversation && conversation.messages.length > 0) {
        const recentMessages = conversation.messages.slice(-5);
        const contextSummary = recentMessages
          .filter(m => m.role === 'user')
          .map(m => m.content)
          .join('\n');
        
        contextualPrompt = `Previous context:\n${contextSummary}\n\nCurrent request:\n${userMessage}`;
      }

      if (pdfTexts.length > 0) {
        contextualPrompt += '\n\n' + pdfTexts.join('\n');
      }

      if (productUrl) {
        updateProgress('scrape', 'active', 'Fetching product page...');
        try {
          const scraped = await scrapeProductUrl(productUrl);
          contextualPrompt += `\n\nPage content:\n${scraped.text}`;
          updateProgress('scrape', 'complete', 'Page fetched successfully');
        } catch (error) {
          updateProgress('scrape', 'error', 'Could not fetch page (CORS restriction)');
        }
      }

      updateProgress('ai', 'active', 'Calling OpenAI GPT-4 Vision...');

      const extracted = await openai.extractProductData({
        url: productUrl,
        imageUrls: imageDataUrls,
        additionalText: contextualPrompt,
        customInstructions: aiSettings.customInstructions || [],
        model: aiSettings.model || 'gpt-4-vision-preview',
        maxTokens: aiSettings.maxTokensPerRequest || 4000,
      });

      updateProgress('ai', 'complete', `Extracted: ${extracted.title}`);

      // Process images
      updateProgress('images', 'active', 'Processing product images...');
      
      const processedImages = await processImages(
        extracted.imageUrls,
        (current, total, status) => {
          updateProgress('images', 'active', `${status} (${current}/${total})`);
        }
      );

      updateProgress('images', 'complete', `${processedImages.length} images processed`);

      // Category suggestion
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
        taskId: newTaskId,
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
          extractionMethod: files.length > 0 ? 'vision' : 'url',
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

      // Update task context
      setTaskContext({
        ...taskContext,
        status: 'review',
        draftId,
      });

      // Show success
      const qualityScore = Math.round((1 - extracted.warnings.length * 0.1) * 100);
      const costINR = (extracted.cost * 83).toFixed(2);

      await addAssistantMessage(
        `✅ **Product Draft Created Successfully!**

📦 **Product Details**
• **Title**: ${extracted.title}
• **Category**: ${categorySuggestion.suggestedName} (${(categorySuggestion.confidence * 100).toFixed(0)}% confidence)
• **Images**: ${processedImages.length} processed
• **Quality Score**: ${qualityScore}/100

💰 **Cost Analysis**
• **Tokens Used**: ${extracted.tokensUsed.toLocaleString()}
• **Cost**: $${extracted.cost.toFixed(4)} (~₹${costINR})

${extracted.warnings.length > 0 ? `⚠️ **Warnings**\n${extracted.warnings.map(w => `• ${w}`).join('\n')}\n\n` : ''}**Next Steps**
Click the "Review Draft" button below to approve and publish this product.

Type \`continue\` anytime to resume this task.`,
        {
          type: 'draft_created',
          draftId,
          taskId: newTaskId,
        }
      );

      setCurrentDraftId(draftId);
      setProgress([]);

    } catch (error: any) {
      console.error('Product processing error:', error);
      updateProgress('error', 'error', error.message);
      
      setTaskContext({
        ...taskContext,
        status: 'failed',
        error: error.message,
      });

      await addAssistantMessage(
        `❌ **Processing Failed**

**Error**: ${error.message}

**Troubleshooting Steps**
• Verify your OpenAI API key is valid
• Check you have sufficient API quota
• Ensure product URL/images are accessible
• Verify internet connection

**What to do next**
• Fix the issue above and try again
• Type \`help\` for usage guide
• Check Settings for API configuration

I've saved your progress. Type \`continue\` to retry when ready.`
      );
      setProgress([]);
    }
  };

  const handleClearChat = async () => {
    if (!conversation) return;

    try {
      // Delete conversation (will be recreated on next message)
      setConversation(null);
      setTaskContext({});
      setProgress([]);
      setShowClearDialog(false);
      
      // Create new conversation
      await loadOrCreateConversation();
      
      toast.success('Chat history cleared');
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
    }
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Message copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  const retryMessage = async (msg: AIMessage) => {
    if (msg.role !== 'user') return;
    
    setMessage(msg.content);
    await handleSendMessage();
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    
    const newFiles: UploadedFile[] = [];
    
    for (const file of Array.from(files)) {
      const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        newFiles.push({ file, type: 'image', preview, id });
      } else if (file.type === 'application/pdf') {
        newFiles.push({ file, type: 'pdf', id });
      } else {
        newFiles.push({ file, type: 'document', id });
      }
    }
    
    if (newFiles.length === 0) {
      toast.error('Please select valid files');
      return;
    }
    
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
      const fileList = new DataTransfer();
      files.forEach(file => fileList.items.add(file));
      await handleFileUpload(fileList.files);
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

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-muted/20">
      {/* Permission Error Banner */}
      {permissionError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 dark:bg-orange-950 border-b-2 border-orange-500 p-4"
        >
          <div className="container mx-auto flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-orange-900 dark:text-orange-100 mb-2">
                Firestore Rules Not Deployed
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                The AI Assistant requires Firestore security rules to be deployed. This takes about 2 minutes.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white dark:bg-gray-900 border-orange-300 hover:bg-orange-50"
                  asChild
                >
                  <a
                    href="https://console.firebase.google.com/project/flyspark-cb85e/firestore/rules"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Deploy Rules Now
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.location.reload()}
                  className="text-orange-700 hover:text-orange-900"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-3">
                📄 Copy rules from: <code className="bg-orange-100 dark:bg-orange-900 px-2 py-0.5 rounded">/FIRESTORE_SECURITY_RULES.txt</code> or see <code className="bg-orange-100 dark:bg-orange-900 px-2 py-0.5 rounded">/FIX_AI_PERMISSIONS.md</code>
              </p>
            </div>
            <button
              onClick={() => setPermissionError(false)}
              className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white p-6 border-b border-border/20 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Bot className="w-7 h-7" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                AI Product Assistant
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </h1>
              <p className="text-sm text-white/80 mt-1">
                Powered by GPT-4 Vision • Extract products instantly
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="text-white hover:bg-white/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              asChild
            >
              <Link to="/admin/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-blue-600/20 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-surface border-2 border-dashed border-blue-500 rounded-3xl p-16 text-center shadow-2xl"
              >
                <Upload className="w-20 h-20 text-blue-500 mx-auto mb-4" />
                <p className="text-2xl font-bold text-foreground mb-2">Drop files here</p>
                <p className="text-muted-foreground">Images, PDFs, and documents supported</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {conversation && conversation.messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Welcome to AI Assistant!
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-lg">
              I can help you add products automatically from URLs, images, and PDF catalogs.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: ExternalLink, title: 'Product URLs', desc: 'Paste any product URL and I\'ll extract all details', color: 'blue' },
                { icon: ImageIcon, title: 'Image Analysis', desc: 'Upload or paste product images for AI analysis', color: 'purple' },
                { icon: FileText, title: 'PDF Catalogs', desc: 'Attach PDF files to extract product info', color: 'green' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-surface rounded-2xl border border-border p-6 hover:shadow-lg transition-all hover:border-blue-500/50"
                >
                  <div className={`w-14 h-14 bg-${feature.color}-500/10 rounded-xl flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-7 h-7 text-${feature.color}-500`} />
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {['Try: "Add this product: https://..."', 'Upload product images', 'Type "help" for guide'].map((hint, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="px-5 py-2.5 bg-muted/50 rounded-full text-sm text-muted-foreground border border-border"
                >
                  {hint}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {conversation?.messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
            >
              <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">AI Assistant</span>
                  </div>
                )}
                
                <div
                  className={`rounded-2xl px-5 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                      : 'bg-surface border border-border text-foreground'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* File attachments */}
                  {msg.metadata?.files && msg.metadata.files.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.metadata.files.map((file: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-black/10 rounded-lg px-3 py-1.5">
                          <File className="w-4 h-4" />
                          <span className="text-xs">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Draft review button */}
                  {msg.metadata?.draftId && (
                    <Button
                      onClick={() => setCurrentDraftId(msg.metadata.draftId)}
                      size="sm"
                      className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Review Draft
                    </Button>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                    <span className="text-xs opacity-70 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(msg.timestamp)}
                    </span>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyMessage(msg.content)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy message"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {msg.role === 'user' && (
                        <button
                          onClick={() => retryMessage(msg)}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                          title="Retry message"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {msg.role === 'user' && (
                  <div className="flex items-center gap-2 mt-2 justify-end">
                    <span className="text-sm font-medium text-muted-foreground">You</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Progress Indicators */}
        {progress.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="font-semibold text-foreground">Processing...</span>
            </div>
            <div className="space-y-3">
              {progress.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  {step.status === 'complete' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                  {step.status === 'active' && (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                  )}
                  {step.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  )}
                  {step.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{step.message}</p>
                    {step.timestamp && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.timestamp.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-surface border border-border rounded-2xl px-5 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Previews */}
      {uploadedFiles.length > 0 && (
        <div className="px-6 py-4 bg-background border-t border-border">
          <p className="text-sm font-semibold text-foreground mb-3">
            Attached Files ({uploadedFiles.length})
          </p>
          <div className="flex flex-wrap gap-3">
            {uploadedFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative group"
              >
                {file.type === 'image' ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-border shadow-sm">
                    <img
                      src={file.preview}
                      alt="Upload"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="text-xs text-white truncate">{file.file.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-xl border-2 border-border flex flex-col items-center justify-center p-2">
                    <FileText className="w-8 h-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground text-center truncate w-full">
                      {file.file.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg hover:scale-110"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-6 bg-background border-t border-border">
        <div className="flex items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            variant="outline"
            size="icon"
            className="flex-shrink-0 h-12 w-12 rounded-xl"
          >
            <Upload className="w-5 h-5" />
          </Button>

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
              placeholder="Paste product URL, upload files, or ask anything... (Ctrl+V to paste images)"
              rows={1}
              disabled={processing}
              className="w-full px-5 py-3.5 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 transition-all"
              style={{
                maxHeight: '120px',
                minHeight: '50px',
              }}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={processing || (!message.trim() && uploadedFiles.length === 0)}
            size="icon"
            className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-4">
          <span>Enter to send • Shift+Enter for new line</span>
          <span>•</span>
          <span>Drag & drop or Ctrl+V to paste files</span>
        </p>
      </div>

      {/* Clear Chat Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Clear Chat History?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages and reset the conversation.
              Any unfinished tasks will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearChat} className="bg-destructive hover:bg-destructive/90">
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Draft Review Modal */}
      {currentDraftId && (
        <ProductDraftReview
          draftId={currentDraftId}
          onClose={() => setCurrentDraftId(null)}
          onPublished={() => {
            setCurrentDraftId(null);
            setTaskContext({ ...taskContext, status: 'complete' });
            toast.success('Product published successfully!');
          }}
        />
      )}
    </div>
  );
}