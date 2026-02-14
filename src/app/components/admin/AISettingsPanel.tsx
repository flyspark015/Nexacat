import { useState, useEffect } from 'react';
import { Bot, Plus, X, Info, DollarSign, Zap } from 'lucide-react';
import { getAISettings, saveAISettings, getAIUsage } from '../../lib/aiService';
import { AISettings, AIUsage } from '../../lib/types';
import { toast } from 'sonner';
import { useAuthStore } from '../../lib/authStore';

interface AISettingsPanelProps {
  onSave?: () => void;
}

export function AISettingsPanel({ onSave }: AISettingsPanelProps) {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<Partial<AISettings>>({
    model: 'gpt-4-vision-preview',
    maxTokensPerRequest: 4000,
    monthlyBudgetINR: 5000,
    enableCostNotifications: true,
    automationLevel: 'semi-auto',
    autoSuggestCategories: true,
    allowCreateCategories: true,
    categoryConfidenceThreshold: 0.7,
    customInstructions: [],
  });
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newInstruction, setNewInstruction] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
      loadUsage();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const data = await getAISettings(user.uid);
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsage = async () => {
    if (!user) return;
    
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const data = await getAIUsage(user.uid, month);
      setUsage(data);
    } catch (error) {
      console.error('Error loading AI usage:', error);
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
      if (onSave) onSave();
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

  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-border p-6">
        <p className="text-muted-foreground">Loading AI settings...</p>
      </div>
    );
  }

  const usdToInr = 83; // Approximate conversion rate
  const budgetPercentage = usage ? (usage.totalCost * usdToInr / (settings.monthlyBudgetINR || 5000)) * 100 : 0;

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
              type={showApiKey ? "text" : "password"}
              value={settings.openaiApiKey || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
              placeholder="sk-proj-..."
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="px-4 py-2 bg-surface border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
            <button
              type="button"
              onClick={async () => {
                // Test API key by making a simple request
                toast.info('Testing API key... (feature coming soon)');
              }}
              className="px-4 py-2 bg-blue-accent text-blue-accent-foreground rounded-lg hover:bg-blue-accent/90 transition-colors"
            >
              Test
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
          <label className="block text-sm font-medium text-foreground mb-2">
            AI Model
          </label>
          <select
            value={settings.model || 'gpt-4-vision-preview'}
            onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value as any }))}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
          >
            <option value="gpt-4-turbo">GPT-4 Turbo (Faster, cheaper)</option>
            <option value="gpt-4-vision-preview">GPT-4 Vision (Recommended for products)</option>
            <option value="gpt-4">GPT-4 (Most capable, expensive)</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            GPT-4 Vision can analyze product screenshots and images
          </p>
        </div>
      </div>

      {/* Cost Controls */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Cost Controls
        </h3>
        
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
      {usage && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground">Usage Statistics (This Month)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-foreground">{usage.totalRequests}</div>
              <div className="text-xs text-muted-foreground">Products Processed</div>
            </div>
            
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-foreground">
                ₹{(usage.totalCost * usdToInr).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Total Cost</div>
            </div>
            
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-foreground">
                {usage.totalTokens.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Tokens Used</div>
            </div>
            
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-foreground">
                ₹{((usage.totalCost * usdToInr) / (usage.totalRequests || 1)).toFixed(2)}
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
