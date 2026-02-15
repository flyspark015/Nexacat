import { useState, useEffect } from 'react';
import { Check, X, FolderPlus, Search, AlertCircle } from 'lucide-react';
import { Category } from '../../lib/types';
import { getAllCategories, createCategory } from '../../lib/firestoreService';
import { uploadCategoryImage } from '../../lib/storageService';
import { toast } from 'sonner';
import { validateCategoryName } from '../../lib/categoryMatcher';

interface CategoryApprovalDialogProps {
  suggestion: {
    suggestedName: string;
    categoryId?: string;
    confidence: number;
    shouldCreate: boolean;
    reasoning: string;
    alternatives?: Array<{
      id: string;
      name: string;
      score: number;
    }>;
  };
  onApprove: (categoryId: string) => void;
  onCancel: () => void;
}

export function CategoryApprovalDialog({ suggestion, onApprove, onCancel }: CategoryApprovalDialogProps) {
  const [mode, setMode] = useState<'suggest' | 'create' | 'select'>(
    suggestion.shouldCreate ? 'suggest' : 'select'
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New category fields
  const [newCategoryName, setNewCategoryName] = useState(suggestion.suggestedName || '');
  const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    // Validate name
    const validation = validateCategoryName(newCategoryName);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Check for duplicates
    const duplicate = categories.find(
      c => c.name.toLowerCase() === newCategoryName.toLowerCase()
    );
    if (duplicate) {
      toast.error('A category with this name already exists');
      return;
    }

    setCreating(true);

    try {
      // Upload image if provided
      let imageUrl = '';
      if (newCategoryImage) {
        imageUrl = await uploadCategoryImage(newCategoryImage);
      }

      // Create slug
      const slug = newCategoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Create category
      const categoryId = await createCategory({
        name: newCategoryName,
        slug,
        imageLocalPath: imageUrl,
      });

      toast.success(`Category "${newCategoryName}" created successfully!`);
      onApprove(categoryId);
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast.error(error.message || 'Failed to create category');
      setCreating(false);
    }
  };

  const handleSelectExisting = (categoryId: string) => {
    onApprove(categoryId);
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full border border-border max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-accent text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderPlus className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Category Selection</h2>
                <p className="text-sm opacity-90 mt-1">
                  AI Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="border-b border-border bg-muted/30">
          <div className="flex">
            <button
              onClick={() => setMode('suggest')}
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                mode === 'suggest'
                  ? 'bg-background text-blue-accent border-b-2 border-blue-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              AI Suggestion
            </button>
            <button
              onClick={() => setMode('create')}
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                mode === 'create'
                  ? 'bg-background text-blue-accent border-b-2 border-blue-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create New
            </button>
            <button
              onClick={() => setMode('select')}
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                mode === 'select'
                  ? 'bg-background text-blue-accent border-b-2 border-blue-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Select Existing
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* AI Suggestion Mode */}
          {mode === 'suggest' && (
            <div className="space-y-4">
              <div className="bg-blue-accent/10 border border-blue-accent/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-accent flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-2">AI Reasoning:</p>
                    <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                  </div>
                </div>
              </div>

              {suggestion.shouldCreate ? (
                <div className="bg-surface rounded-lg border border-border p-6 text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Suggested New Category
                  </h3>
                  <p className="text-2xl font-bold text-blue-accent mb-4">
                    {suggestion.suggestedName}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    AI suggests creating this category because no strong match was found in existing categories.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        setNewCategoryName(suggestion.suggestedName);
                        setMode('create');
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Create This Category
                    </button>
                    <button
                      onClick={() => setMode('select')}
                      className="px-6 py-2 bg-surface border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                    >
                      Choose Existing Instead
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-surface rounded-lg border border-border p-6 text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Suggested Category
                  </h3>
                  <p className="text-2xl font-bold text-green-600 mb-4">
                    {suggestion.suggestedName}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    AI found a strong match with this existing category ({(suggestion.confidence * 100).toFixed(0)}% confidence).
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => suggestion.categoryId && handleSelectExisting(suggestion.categoryId)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Use This Category
                    </button>
                    <button
                      onClick={() => setMode('select')}
                      className="px-6 py-2 bg-surface border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                    >
                      Choose Different
                    </button>
                  </div>
                </div>
              )}

              {/* Show alternatives */}
              {suggestion.alternatives && suggestion.alternatives.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-muted-foreground mb-3">
                    Other Possible Matches:
                  </p>
                  <div className="space-y-2">
                    {suggestion.alternatives.map((alt) => (
                      <button
                        key={alt.id}
                        onClick={() => handleSelectExisting(alt.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-surface border border-border rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <span className="font-medium text-foreground">{alt.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {(alt.score * 100).toFixed(0)}% match
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create New Mode */}
          {mode === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-foreground mb-2">
                  Category Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., LED Lights, Electronics"
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-2">
                  Category Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewCategoryImage(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground"
                />
                {newCategoryImage && (
                  <div className="mt-3">
                    <img
                      src={URL.createObjectURL(newCategoryImage)}
                      alt="Preview"
                      className="h-32 object-cover rounded-lg border border-border"
                    />
                  </div>
                )}
              </div>

              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Tip:</strong> Choose a clear, descriptive name. You can add subcategories later in the Categories management page.
                </p>
              </div>
            </div>
          )}

          {/* Select Existing Mode */}
          {mode === 'select' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>

              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading categories...</p>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'No categories match your search' : 'No categories available'}
                  </p>
                  <button
                    onClick={() => setMode('create')}
                    className="px-6 py-2 bg-blue-accent text-white rounded-lg hover:bg-blue-accent/90 transition-colors"
                  >
                    Create First Category
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleSelectExisting(category.id)}
                      className="flex items-center gap-4 px-4 py-3 bg-surface border border-border rounded-lg hover:bg-muted transition-colors text-left group"
                    >
                      {category.imageLocalPath && (
                        <img
                          src={category.imageLocalPath}
                          alt={category.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-foreground group-hover:text-blue-accent transition-colors">
                          {category.name}
                        </p>
                      </div>
                      <Check className="w-5 h-5 text-muted-foreground group-hover:text-blue-accent transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border p-6 bg-muted/20">
          <div className="flex justify-between gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-surface border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>

            {mode === 'create' && (
              <button
                onClick={handleCreateCategory}
                disabled={creating || !newCategoryName.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                {creating ? 'Creating...' : 'Create & Use Category'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}