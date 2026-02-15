import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, Loader2, Key, DollarSign, Zap, RefreshCw, Plus, X, Info, Bot, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { getAISettings, saveAISettings, getAIUsageStats } from '../../lib/aiService';
import { AISettings } from '../../lib/types';
import { toast } from 'sonner';
import { OpenAIClient } from '../../lib/openaiClient';

const DEFAULT_CUSTOM_INSTRUCTIONS = [
  "Always return structured output: title, short_description, tags, specifications, images_to_download.",
  "Short description must be 3–6 bullet points, customer-friendly.",
  "Extract only high-quality product images; ignore thumbnails/icons.",
  "Never publish automatically — always create a draft and ask admin to confirm.",
  "If category is missing, propose 1 best category + 2 alternatives, then ask approval.",
  "Keep pricing blank and explicitly ask admin to confirm price.",
  "Prefer consistent units: Hz, mm, g, V, A, W; avoid mixed units.",
  "If info is missing, ask the smallest possible questions to complete the draft.",
];

type ModelTab = 'recommended' | 'all';

export function AISettingsPanel() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<Partial<AISettings>>({
    model: 'gpt-5.2', // Default to strongest model for best quality
    maxTokensPerRequest: 8000, // Increased for better output
    monthlyBudgetINR: 50000, // Higher budget for quality-first approach
    categoryConfidenceThreshold: 0.7,
    customInstructions: [...DEFAULT_CUSTOM_INSTRUCTIONS],
  });
  const [availableModels, setAvailableModels] = useState<{
    id: string;
    name: string;
    vision: boolean;
    deprecated: boolean;
  }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [newInstruction, setNewInstruction] = useState('');
  const [modelTab, setModelTab] = useState<ModelTab>('recommended');

  useEffect(() => {
    if (user) {
      loadSettings();
      loadUsageStats();
      loadAvailableModels();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const data = await getAISettings(user.uid);
      if (data) {
        // Migrate deprecated model to gpt-4o
        if (data.model && (
          data.model.includes('vision-preview') || 
          data.model.includes('0314') || 
          data.model.includes('0613')
        )) {
          data.model = 'gpt-4o';
          // Auto-save the migration
          await saveAISettings(user.uid, { model: 'gpt-4o' });
          toast.info('AI model updated to GPT-4o (deprecated model replaced)');
        }
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
    }
  };

  const loadUsageStats = async () => {
    if (!user) return;
    
    try {
      const data = await getAIUsageStats(user.uid);
      setUsageStats(data);
    } catch (error) {
      console.error('Error loading AI usage stats:', error);
    }
  };

  const loadAvailableModels = async () => {
    // Don't try to load models if API key is not set
    if (!settings.openaiApiKey) {
      // Use fallback models
      setAvailableModels([
        { id: 'gpt-4o', name: 'GPT-4o (Recommended)', vision: true, deprecated: false },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cost-effective)', vision: true, deprecated: false },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', vision: true, deprecated: false },
        { id: 'gpt-4', name: 'GPT-4', vision: false, deprecated: false },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', vision: false, deprecated: false },
      ]);
      return;
    }

    setLoadingModels(true);
    try {
      const client = new OpenAIClient(settings.openaiApiKey);
      const models = await client.listModels();
      setAvailableModels(models.map(model => ({
        id: model.id,
        name: model.name,
        vision: model.capabilities.vision,
        deprecated: model.deprecated,
      })));
    } catch (error) {
      console.error('Error loading available models:', error);
      // Use fallback models on error
      setAvailableModels([
        { id: 'gpt-4o', name: 'GPT-4o (Recommended)', vision: true, deprecated: false },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cost-effective)', vision: true, deprecated: false },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', vision: true, deprecated: false },
        { id: 'gpt-4', name: 'GPT-4', vision: false, deprecated: false },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', vision: false, deprecated: false },
      ]);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validate API key format
    if (settings.openaiApiKey && !settings.openaiApiKey.startsWith('sk-')) {
      toast.error('Invalid OpenAI API key format. It should start with "sk-"');
      return;
    }
    
    setSaving(true);
    try {
      await saveAISettings(user.uid, settings);
      toast.success('AI settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving AI settings:', error);
      toast.error(error.message || 'Failed to save AI settings');
    } finally {
      setSaving(false);
    }
  };

  const addInstruction = () => {
    if (!newInstruction.trim()) {
      toast.error('Instruction cannot be empty');
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      customInstructions: [...(prev.customInstructions || []), newInstruction.trim()],
    }));
    setNewInstruction('');
  };

  const removeInstruction = (index: number) => {
    setSettings(prev => ({
      ...prev,
      customInstructions: prev.customInstructions?.filter((_, i) => i !== index) || [],
    }));
  };

  const testApiKey = async () => {
    if (!settings.openaiApiKey) {
      toast.error('OpenAI API key is required');
      return;
    }
    
    setTesting(true);
    try {
      const client = new OpenAIClient(settings.openaiApiKey);
      const models = await client.listModels();
      if (models.length > 0) {
        setApiKeyValid(true);
        toast.success('API key is valid and working!');
      } else {
        setApiKeyValid(false);
        toast.error('API key is valid but no models found. Check your API key permissions.');
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      setApiKeyValid(false);
      toast.error('API key is invalid. Please check and try again.');
    } finally {
      setTesting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-surface rounded-lg border border-border p-6">
        <p className="text-muted-foreground">Please log in to access AI settings.</p>
      </div>
    );
  }

  const usdToInr = 83; // Approximate conversion rate
  const budgetPercentage = usageStats ? (usageStats.totalCost * usdToInr / (settings.monthlyBudgetINR || 5000)) * 100 : 0;

  const recommendedModels = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      label: '⭐ Best Overall',
      description: 'Proven model with vision support. Best balance of quality, speed, and cost.',
      cost: 'Medium',
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      label: '💰 Budget Option',
      description: 'Cost-effective with vision support. Great for high-volume extraction.',
      cost: 'Low',
    },
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      label: '🧠 Smartest',
      description: 'Most intelligent non-reasoning model. Best for complex product pages.',
      cost: 'High',
    },
    {
      id: 'gpt-5.2',
      name: 'GPT-5.2',
      label: '🚀 Latest',
      description: 'Newest frontier model with advanced capabilities.',
      cost: 'Very High',
    },
  ];

  return (
    <div className="bg-surface rounded-lg border border-border p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Bot className="w-6 h-6 text-blue-accent" />
        <h2 className="text-xl font-semibold text-foreground">AI Product Assistant</h2>
      </div>

      {/* API Configuration */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">OpenAI API Configuration</h3>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            OpenAI API Key <span className="text-destructive">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type={apiKeyValid === false ? "text" : "password"}
              value={settings.openaiApiKey || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
              placeholder="sk-proj-..."
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setApiKeyValid(false)}
              className="px-4 py-2 bg-surface border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              {apiKeyValid === false ? 'Hide' : 'Show'}
            </button>
            <button
              type="button"
              onClick={testApiKey}
              className="px-4 py-2 bg-blue-accent text-blue-accent-foreground rounded-lg hover:bg-blue-accent/90 transition-colors"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Get your API key from{' '}
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-accent hover:underline"
            >
              OpenAI Platform
            </a>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            AI Model
          </label>
          
          {/* Model Selection Tabs */}
          <div className="mb-3 flex gap-2 border-b border-border">
            <button
              type="button"
              onClick={() => setModelTab('recommended')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                modelTab === 'recommended'
                  ? 'border-blue-accent text-blue-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Recommended
              </div>
            </button>
            <button
              type="button"
              onClick={() => setModelTab('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                modelTab === 'all'
                  ? 'border-blue-accent text-blue-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              All Available ({availableModels.length})
            </button>
          </div>

          {/* Model Selector */}
          {modelTab === 'recommended' ? (
            <div className="space-y-2">
              {/* Recommended Models Grid */}
              <div className="grid gap-3">
                {recommendedModels.map((model) => (
                  <label
                    key={model.id}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      settings.model === model.id
                        ? 'border-blue-accent bg-blue-accent/5'
                        : 'border-border hover:border-blue-accent/50 hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={model.id}
                      checked={settings.model === model.id}
                      onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value as any }))}
                      className="mt-1 w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{model.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-accent/10 text-blue-accent font-medium">
                          {model.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{model.description}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">Cost: <strong className="text-foreground">{model.cost}</strong></span>
                        <span className="text-green-600 dark:text-green-400">✓ Vision</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="bg-blue-accent/5 border border-blue-accent/20 rounded-lg p-3 space-y-1.5">
                <p className="text-xs text-foreground">
                  💡 <strong>Recommendation:</strong>
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                  <li><strong>GPT-4o</strong>: Best for most product extraction tasks (balanced cost/quality)</li>
                  <li><strong>GPT-4o Mini</strong>: Great for high-volume or budget-conscious workflows</li>
                  <li><strong>GPT-4.1</strong>: Use for complex/messy product pages that need smarter parsing</li>
                  <li><strong>GPT-5.2</strong>: Latest model with cutting-edge capabilities (highest cost)</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value={settings.model || 'gpt-4o'}
                onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value as any }))}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
              >
                {availableModels.map(model => (
                  <option key={model.id} value={model.id} disabled={model.deprecated}>
                    {model.name} {model.vision ? '(Vision)' : ''} {model.deprecated ? '(Deprecated)' : ''}
                  </option>
                ))}
              </select>
              {settings.model && availableModels.find(m => m.id === settings.model && !m.vision) && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">
                    <strong>Warning:</strong> Model "{settings.model}" does not support vision. Image-based product extraction will fail. Please select a vision-capable model for best results.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cost Controls */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Cost Controls
        </h3>
        
        <div className="bg-blue-accent/10 border border-blue-accent/20 rounded-lg p-3 text-xs text-foreground">
          <strong>💡 Image Optimization:</strong> Images are automatically resized to 800x800px and compressed to reduce token usage. Max 2 images per request.
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Max Tokens per Request
          </label>
          <input
            type="number"
            value={settings.maxTokensPerRequest || 4000}
            onChange={(e) => setSettings(prev => ({ ...prev, maxTokensPerRequest: parseInt(e.target.value) }))}
            min="1000"
            max="8000"
            step="500"
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Higher values allow longer descriptions but cost more
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Monthly Budget Alert (INR)
          </label>
          <input
            type="number"
            value={settings.monthlyBudgetINR || 5000}
            onChange={(e) => setSettings(prev => ({ ...prev, monthlyBudgetINR: parseInt(e.target.value) }))}
            min="500"
            step="500"
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="cost-notifications"
            checked={settings.enableCostNotifications ?? true}
            onChange={(e) => setSettings(prev => ({ ...prev, enableCostNotifications: e.target.checked }))}
            className="w-4 h-4 rounded border-border text-blue-accent focus:ring-2 focus:ring-blue-accent"
          />
          <label htmlFor="cost-notifications" className="text-sm text-foreground cursor-pointer">
            Enable cost notifications
          </label>
        </div>
      </div>

      {/* Automation Level */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Automation Level
        </h3>
        
        <div className="space-y-2">
          <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="radio"
              name="automation"
              value="manual"
              checked={settings.automationLevel === 'manual'}
              onChange={(e) => setSettings(prev => ({ ...prev, automationLevel: e.target.value as any }))}
              className="mt-1 w-4 h-4"
            />
            <div className="flex-1">
              <div className="font-medium text-foreground">Fully Manual</div>
              <div className="text-xs text-muted-foreground">AI provides suggestions only, you fill everything manually</div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="radio"
              name="automation"
              value="semi-auto"
              checked={settings.automationLevel === 'semi-auto'}
              onChange={(e) => setSettings(prev => ({ ...prev, automationLevel: e.target.value as any }))}
              className="mt-1 w-4 h-4"
            />
            <div className="flex-1">
              <div className="font-medium text-foreground">Semi-Automatic (Recommended)</div>
              <div className="text-xs text-muted-foreground">AI creates drafts, you review and approve before publishing</div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors opacity-50">
            <input
              type="radio"
              name="automation"
              value="auto-publish"
              disabled
              className="mt-1 w-4 h-4"
            />
            <div className="flex-1">
              <div className="font-medium text-foreground">Auto-Publish (Not Recommended)</div>
              <div className="text-xs text-muted-foreground">AI publishes products automatically - HIGH RISK</div>
            </div>
          </label>
        </div>
      </div>

      {/* Category Intelligence */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Category Intelligence</h3>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto-suggest"
            checked={settings.autoSuggestCategories ?? true}
            onChange={(e) => setSettings(prev => ({ ...prev, autoSuggestCategories: e.target.checked }))}
            className="w-4 h-4 rounded border-border text-blue-accent focus:ring-2 focus:ring-blue-accent"
          />
          <label htmlFor="auto-suggest" className="text-sm text-foreground cursor-pointer">
            Auto-suggest categories based on product data
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allow-create"
            checked={settings.allowCreateCategories ?? true}
            onChange={(e) => setSettings(prev => ({ ...prev, allowCreateCategories: e.target.checked }))}
            className="w-4 h-4 rounded border-border text-blue-accent focus:ring-2 focus:ring-blue-accent"
          />
          <label htmlFor="allow-create" className="text-sm text-foreground cursor-pointer">
            Allow AI to suggest creating new categories
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Confidence Threshold for New Categories
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.categoryConfidenceThreshold || 0.7}
              onChange={(e) => setSettings(prev => ({ ...prev, categoryConfidenceThreshold: parseFloat(e.target.value) }))}
              className="flex-1"
            />
            <span className="text-sm font-medium text-foreground w-12">
              {Math.round((settings.categoryConfidenceThreshold || 0.7) * 100)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            AI will suggest new category only if confidence is below this threshold
          </p>
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Info className="w-4 h-4" />
          Custom Instructions
        </h3>
        <p className="text-xs text-muted-foreground">
          Add custom instructions to guide the AI's behavior. Each instruction should be a complete sentence or paragraph.
        </p>

        {/* Instruction List */}
        {settings.customInstructions && settings.customInstructions.length > 0 && (
          <div className="space-y-2">
            {settings.customInstructions.map((instruction, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-background border border-border rounded-lg group"
              >
                <div className="flex-1 text-sm text-foreground whitespace-pre-wrap">
                  {instruction}
                </div>
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Instruction */}
        <div className="space-y-2">
          <textarea
            value={newInstruction}
            onChange={(e) => setNewInstruction(e.target.value)}
            placeholder="Add a custom instruction (e.g., 'Always emphasize energy efficiency for electronic products')"
            rows={3}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent resize-none"
          />
          <button
            type="button"
            onClick={addInstruction}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Instruction
          </button>
        </div>
      </div>

      {/* Usage Statistics */}
      {usageStats && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground">Usage Statistics (This Month)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-foreground">{usageStats.totalRequests || 0}</div>
              <div className="text-xs text-muted-foreground">Products Processed</div>
            </div>
            
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-foreground">
                ₹{((usageStats.totalCost || 0) * usdToInr).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Total Cost</div>
            </div>
            
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-foreground">
                {(usageStats.totalTokens || 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Tokens Used</div>
            </div>
            
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-foreground">
                ₹{(((usageStats.totalCost || 0) * usdToInr) / (usageStats.totalRequests || 1)).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Avg Cost/Product</div>
            </div>
          </div>

          {/* Budget Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Monthly Budget</span>
              <span className="text-foreground font-medium">
                {budgetPercentage.toFixed(0)}% used
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  budgetPercentage > 90 ? 'bg-destructive' : 
                  budgetPercentage > 70 ? 'bg-yellow-500' : 
                  'bg-blue-accent'
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !settings.openaiApiKey}
          className="w-full px-6 py-3 bg-blue-accent text-blue-accent-foreground rounded-lg hover:bg-blue-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {saving ? 'Saving...' : 'Save AI Settings'}
        </button>
        {!settings.openaiApiKey && (
          <p className="text-xs text-destructive mt-2 text-center">
            OpenAI API key is required
          </p>
        )}
      </div>
    </div>
  );
}