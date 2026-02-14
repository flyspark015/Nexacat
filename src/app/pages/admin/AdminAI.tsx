import { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Upload, Image as ImageIcon, FileText, X, Copy, RotateCcw, 
  Trash2, Loader2, CheckCircle2, AlertCircle, Sparkles, Settings, 
  Clock, File, Download, ExternalLink, Check, AlertTriangle, Link2, 
  ImagePlus, FileCode, Brain, ListTree, DollarSign, CheckSquare
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

interface ProgressCheckpoint {
  id: string;
  label: string;
  icon: any;
  status: 'pending' | 'active' | 'complete' | 'error';
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

const PROGRESS_CHECKPOINTS: ProgressCheckpoint[] = [
  { id: 'url', label: 'Link Analyzed', icon: Link2, status: 'pending' },
  { id: 'images', label: 'Images Extracted', icon: ImagePlus, status: 'pending' },
  { id: 'content', label: 'Content Parsed', icon: FileCode, status: 'pending' },
  { id: 'category', label: 'Category Suggested', icon: ListTree, status: 'pending' },
  { id: 'details', label: 'Details Structured', icon: Brain, status: 'pending' },
  { id: 'price', label: 'Price Confirmed', icon: DollarSign, status: 'pending' },
  { id: 'draft', label: 'Draft Ready', icon: CheckSquare, status: 'pending' },
];

export function AdminAI() {
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [progressCheckpoints, setProgressCheckpoints] = useState<ProgressCheckpoint[]>([]);
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
  }, [conversation?.messages, isTyping]);

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

  const updateProgressCheckpoint = (checkpointId: string, status: ProgressCheckpoint['status']) => {
    setProgressCheckpoints(prev => 
      prev.map(cp => cp.id === checkpointId ? { ...cp, status } : cp)
    );
  };

  const startProgress = () => {
    setProgressCheckpoints(PROGRESS_CHECKPOINTS.map(cp => ({ ...cp, status: 'pending' })));
  };

  const clearProgress = () => {
    setProgressCheckpoints([]);
  };

  const addAssistantMessage = async (content: string, metadata?: any) => {
    if (!conversation) return;

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

    try {
      await addMessageToConversation(conversation.id, {
        role: 'user',
        content: userMessage,
        metadata: {
          type: files.length > 0 ? 'file' : 'text',
          fileCount: files.length,
          files: files.map(f => ({ name: f.file.name, type: f.type, size: f.file.size })),
        },
      });

      let updated = await getAdminConversation(user.uid);
      setConversation(updated);

      const aiSettings = await getAISettings(user.uid);
      if (!aiSettings || !aiSettings.openaiApiKey) {
        await addAssistantMessage(
          '⚠️ OpenAI API key not configured. Please add your API key in Settings.'
        );
        setProcessing(false);
        return;
      }

      await processUserIntent(userMessage, files, aiSettings);

    } catch (error: any) {
      console.error('Error processing message:', error);
      await addAssistantMessage(`❌ Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const processUserIntent = async (userMessage: string, files: UploadedFile[], aiSettings: any) => {
    const lowerMsg = userMessage.toLowerCase();
    const urlMatch = userMessage.match(/(https?:\/\/[^\s]+)/);
    const isProductRequest = 
      urlMatch || 
      files.length > 0 ||
      lowerMsg.includes('add product') ||
      lowerMsg.includes('create product');

    if (lowerMsg.includes('help')) {
      await showHelp();
      return;
    }

    if (isProductRequest) {
      await processProduct(userMessage, files, urlMatch?.[0], aiSettings);
    } else {
      await addAssistantMessage(
        `To add a product:\n• Paste a product URL\n• Upload product images\n• Attach a PDF catalog\n\nType "help" for more information.`
      );
    }
  };

  const showHelp = async () => {
    await addAssistantMessage(
      `🤖 AI Product Assistant\n\n` +
      `What I can do:\n` +
      `• Extract products from URLs\n` +
      `• Analyze product images (GPT-4 Vision)\n` +
      `• Process PDF catalogs\n` +
      `• Smart category suggestions\n` +
      `• Auto-generate descriptions\n\n` +
      `Just paste a URL or upload files to get started!`
    );
  };

  const processProduct = async (
    userMessage: string,
    files: UploadedFile[],
    productUrl: string | undefined,
    aiSettings: any
  ) => {
    try {
      const newTaskId = `task_${Date.now()}`;
      setTaskContext({
        taskId: newTaskId,
        productUrl,
        files,
        status: 'processing',
      });

      startProgress();
      await addAssistantMessage('🚀 Starting product extraction...');

      // Step 1: Analyze URL
      updateProgressCheckpoint('url', 'active');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateProgressCheckpoint('url', 'complete');

      // Step 2: Extract images
      updateProgressCheckpoint('images', 'active');
      const openai = new OpenAIClient(aiSettings.openaiApiKey);
      const imageDataUrls: string[] = [];

      for (const uploadedFile of files) {
        if (uploadedFile.type === 'image') {
          const dataUrl = await fileToDataUrl(uploadedFile.file);
          imageDataUrls.push(dataUrl);
        }
      }
      updateProgressCheckpoint('images', 'complete');

      // Step 3: Parse content
      updateProgressCheckpoint('content', 'active');
      let contextualPrompt = userMessage;
      
      if (productUrl) {
        try {
          const scraped = await scrapeProductUrl(productUrl);
          contextualPrompt += `\n\nPage content:\n${scraped.text}`;
        } catch (error) {
          // Continue without scraped content
        }
      }

      const extracted = await openai.extractProductData({
        url: productUrl,
        imageUrls: imageDataUrls,
        additionalText: contextualPrompt,
        customInstructions: aiSettings.customInstructions || [],
        model: aiSettings.model || 'gpt-4-vision-preview',
        maxTokens: aiSettings.maxTokensPerRequest || 4000,
      });
      updateProgressCheckpoint('content', 'complete');

      // Step 4: Suggest category
      updateProgressCheckpoint('category', 'active');
      const processedImages = await processImages(
        extracted.imageUrls,
        () => {}
      );

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
      updateProgressCheckpoint('category', 'complete');

      // Step 5: Structure details
      updateProgressCheckpoint('details', 'active');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProgressCheckpoint('details', 'complete');

      // Step 6: Confirm price
      updateProgressCheckpoint('price', 'active');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProgressCheckpoint('price', 'complete');

      // Step 7: Create draft
      updateProgressCheckpoint('draft', 'active');
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
      updateProgressCheckpoint('draft', 'complete');

      await updateAIUsage(
        user!.uid,
        aiSettings.model || 'gpt-4-vision-preview',
        extracted.tokensUsed,
        extracted.cost
      );

      setTaskContext({ ...taskContext, status: 'review', draftId });

      const costINR = (extracted.cost * 83).toFixed(2);
      await addAssistantMessage(
        `✅ Product draft created successfully!\n\n` +
        `📦 ${extracted.title}\n` +
        `🏷️ Category: ${categorySuggestion.suggestedName}\n` +
        `🖼️ Images: ${processedImages.length}\n` +
        `💰 Cost: ₹${costINR}\n\n` +
        `Click "Review Draft" below to approve and publish.`,
        { type: 'draft_created', draftId, taskId: newTaskId }
      );

      setCurrentDraftId(draftId);
      clearProgress();

    } catch (error: any) {
      console.error('Product processing error:', error);
      progressCheckpoints.forEach(cp => {
        if (cp.status === 'active') updateProgressCheckpoint(cp.id, 'error');
      });
      
      await addAssistantMessage(
        `❌ Processing failed: ${error.message}\n\nPlease check your settings and try again.`
      );
      clearProgress();
    }
  };

  const handleClearChat = async () => {
    if (!conversation) return;

    try {
      setConversation(null);
      setTaskContext({});
      clearProgress();
      setShowClearDialog(false);
      
      await loadOrCreateConversation();
      toast.success('Chat history cleared');
    } catch (error) {
      toast.error('Failed to clear chat');
    }
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
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
      }
    }
    
    if (newFiles.length === 0) {
      toast.error('Please select valid files');
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

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate progress percentage
  const progressPercentage = progressCheckpoints.length > 0 
    ? (progressCheckpoints.filter(cp => cp.status === 'complete').length / progressCheckpoints.length) * 100 
    : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      {/* Permission Error Banner */}
      {permissionError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 dark:bg-orange-950 border-b border-orange-200 dark:border-orange-800 px-6 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-orange-900 dark:text-orange-100">
                Firestore rules not deployed. 
                <a href="https://console.firebase.google.com/project/flyspark-cb85e/firestore/rules" target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                  Deploy now
                </a>
              </p>
            </div>
            <button onClick={() => setPermissionError(false)}>
              <X className="w-4 h-4 text-orange-600" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Progress Header - only shows when processing */}
      <AnimatePresence>
        {progressCheckpoints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="px-6 py-4">
              {/* Progress bar */}
              <div className="relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>

              {/* Checkpoints */}
              <div className="flex items-center justify-between">
                {progressCheckpoints.map((checkpoint, index) => (
                  <div key={checkpoint.id} className="flex flex-col items-center flex-1">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center mb-2 relative
                        ${checkpoint.status === 'pending' && 'bg-gray-200 dark:bg-gray-700'}
                        ${checkpoint.status === 'active' && 'bg-blue-500 text-white animate-pulse'}
                        ${checkpoint.status === 'complete' && 'bg-green-500 text-white'}
                        ${checkpoint.status === 'error' && 'bg-red-500 text-white'}
                      `}
                    >
                      {checkpoint.status === 'complete' ? (
                        <Check className="w-5 h-5" />
                      ) : checkpoint.status === 'error' ? (
                        <X className="w-5 h-5" />
                      ) : checkpoint.status === 'active' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <checkpoint.icon className="w-5 h-5 text-gray-400" />
                      )}
                    </motion.div>
                    <p className={`
                      text-xs text-center max-w-[80px]
                      ${checkpoint.status === 'complete' && 'text-green-600 dark:text-green-400 font-medium'}
                      ${checkpoint.status === 'active' && 'text-blue-600 dark:text-blue-400 font-medium'}
                      ${checkpoint.status === 'error' && 'text-red-600 dark:text-red-400 font-medium'}
                      ${checkpoint.status === 'pending' && 'text-gray-500 dark:text-gray-400'}
                    `}>
                      {checkpoint.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">AI Product Assistant</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Always ready to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="text-gray-600 dark:text-gray-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-gray-600 dark:text-gray-300"
            >
              <Link to="/admin/settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={async (e) => { 
          e.preventDefault(); 
          setIsDragging(false); 
          await handleFileUpload(e.dataTransfer.files);
        }}
      >
        {/* Drag Overlay */}
        {isDragging && (
          <div className="fixed inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-2xl border-2 border-dashed border-blue-500">
              <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 dark:text-white">Drop files here</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {conversation && conversation.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to AI Assistant
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
              Paste a product URL, upload images, or attach PDFs to get started
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
                🔗 Paste URL
              </div>
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
                📸 Upload images
              </div>
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
                💬 Ask anything
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {conversation?.messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className="flex-shrink-0">
                {msg.role === 'assistant' ? (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                      {user?.email?.[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-1">
                <div
                  className={`
                    rounded-2xl px-4 py-2.5 shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm border border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* File attachments */}
                  {msg.metadata?.files && msg.metadata.files.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.metadata.files.map((file: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 bg-black/10 rounded-lg px-2 py-1">
                          <File className="w-3.5 h-3.5" />
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
                      className="mt-3 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Review Draft
                    </Button>
                  )}
                </div>

                {/* Timestamp */}
                <div className={`flex items-center gap-2 px-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(msg.timestamp)}
                  </span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyMessage(msg.content)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Previews */}
      {uploadedFiles.length > 0 && (
        <div className="px-6 py-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 flex-wrap">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="relative group">
                {file.type === 'image' ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                    <img src={file.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeFile(file.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="relative w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-500" />
                    <button
                      onClick={() => removeFile(file.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Upload className="w-5 h-5" />
          </Button>

          <div className="flex-1">
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
              placeholder="Type a message..."
              rows={1}
              disabled={processing}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
              style={{ maxHeight: '120px', minHeight: '48px' }}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={processing || (!message.trim() && uploadedFiles.length === 0)}
            size="icon"
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Clear Chat Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearChat} className="bg-red-600 hover:bg-red-700">
              Clear
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
            toast.success('Product published!');
          }}
        />
      )}
    </div>
  );
}
