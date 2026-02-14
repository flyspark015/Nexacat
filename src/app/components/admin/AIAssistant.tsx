import { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import {
  getAIConversation,
  createAIConversation,
  addMessageToConversation,
  updateConversationContext,
  getAISettings,
} from '../../lib/aiService';
import { AIConversation } from '../../lib/types';
import { toast } from 'sonner';

export function AIAssistant() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && isOpen) {
      loadOrCreateConversation();
    }
  }, [user, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadOrCreateConversation = async () => {
    if (!user) return;

    try {
      let conv = await getAIConversation(user.uid);
      
      if (!conv) {
        const convId = await createAIConversation(user.uid);
        conv = await getAIConversation(convId);
      }

      setConversation(conv);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!conversation || !user) return;
    if (!message.trim() && uploadedImages.length === 0) return;

    // Check if AI settings are configured
    try {
      const aiSettings = await getAISettings(user.uid);
      if (!aiSettings || !aiSettings.openaiApiKey) {
        toast.error('Please configure your OpenAI API key in Settings first');
        return;
      }
    } catch (error) {
      console.error('Error checking AI settings:', error);
      toast.error('Please configure AI settings first');
      return;
    }

    const userMessage = message;
    setMessage('');
    setLoading(true);

    try {
      // Add user message
      await addMessageToConversation(conversation.id, {
        role: 'user',
        content: userMessage,
        metadata: {
          type: uploadedImages.length > 0 ? 'image' : 'text',
        },
      });

      // Reload conversation to get updated messages
      const updatedConv = await getAIConversation(conversation.id);
      setConversation(updatedConv);

      // Here we would trigger the Firebase Cloud Function
      // For now, show a placeholder response
      setTimeout(async () => {
        const aiResponse = generatePlaceholderResponse(userMessage);
        
        await addMessageToConversation(conversation.id, {
          role: 'assistant',
          content: aiResponse,
          metadata: {
            type: 'text',
          },
        });

        const finalConv = await getAIConversation(conversation.id);
        setConversation(finalConv);
        setLoading(false);
      }, 1000);

      setUploadedImages([]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setLoading(false);
    }
  };

  const generatePlaceholderResponse = (userMsg: string): string => {
    const lowerMsg = userMsg.toLowerCase();
    
    if (lowerMsg.includes('add product') || lowerMsg.includes('create product')) {
      return `I can help you add a new product! To get started, please provide:

1. **Product URL** - Link to the product page
2. **Screenshots** (optional) - Images of the product 
3. **Additional details** - Any specific information you want to include

You can paste a product URL or upload screenshots, and I'll extract:
- Product title and description
- Specifications
- Images
- Suggested category
- Tags

Just share the product details and I'll create a draft for your review!`;
    }
    
    if (lowerMsg.includes('help') || lowerMsg.includes('what can')) {
      return `I'm your AI Product Assistant! Here's what I can do:

**Add Products**
- Extract product data from URLs
- Analyze product screenshots  
- Generate descriptions and specs
- Suggest categories automatically

**Smart Features**
- Category intelligence
- Image optimization
- SEO-friendly content
- Quality scoring

Just tell me what you need, and I'll guide you through it!`;
    }
    
    return `I understand you want to: "${userMsg}"

This feature is currently being set up. Once the Firebase Cloud Functions are deployed, I'll be able to:
- Process product URLs
- Analyze images with GPT-4 Vision
- Generate complete product drafts
- Suggest categories intelligently

For now, please complete the Firebase setup as outlined in the implementation guide.`;
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
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-accent to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="w-6 h-6" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h3 className="font-semibold">AI Product Assistant</h3>
            <p className="text-xs opacity-90">Powered by GPT-4</p>
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
              const updated = await getAIConversation(conversation.id);
              setConversation(updated);
            }
          }}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
        >
          <option value="idle">💬 Chat Mode</option>
          <option value="add_product">✨ Add Product</option>
          <option value="bulk_import">📦 Bulk Import</option>
          <option value="update_product">🔄 Update Product</option>
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
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              I can help you add products automatically by analyzing URLs and images.
              Select a mode above and start chatting!
            </p>
          </div>
        )}

        {conversation?.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-accent text-white'
                  : 'bg-surface border border-border text-foreground'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-surface border border-border text-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
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
            className="p-2.5 bg-surface border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
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
              placeholder="Type a message... (paste URL, ask questions)"
              rows={1}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent resize-none"
              style={{
                maxHeight: '120px',
                minHeight: '42px',
              }}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={loading || (!message.trim() && uploadedImages.length === 0)}
            className="p-2.5 bg-blue-accent text-white rounded-lg hover:bg-blue-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
