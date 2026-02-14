import { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Sparkles, Edit2, Save, ExternalLink } from 'lucide-react';
import { ProductDraft, Category } from '../../lib/types';
import { updateProductDraft, getProductDraft } from '../../lib/aiService';
import { createProduct } from '../../lib/firestoreService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { CategoryApprovalDialog } from './CategoryApprovalDialog';

interface ProductDraftReviewProps {
  draftId: string;
  onClose: () => void;
  onPublished: () => void;
}

export function ProductDraftReview({ draftId, onClose, onPublished }: ProductDraftReviewProps) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [editing, setEditing] = useState(false);
  
  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stockStatus, setStockStatus] = useState<'in-stock' | 'out-of-stock' | 'preorder'>('in-stock');
  
  // Category approval
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  useEffect(() => {
    loadDraft();
  }, [draftId]);

  const loadDraft = async () => {
    try {
      const data = await getProductDraft(draftId);
      if (data) {
        setDraft(data);
        setTitle(data.product.name);
        setDescription(data.product.description);
        setShortDescription(data.product.shortDescription);
        setTags(data.product.tags);
        setSpecs(data.product.specs);
        setStockStatus(data.product.stockStatus);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast.error('Failed to load draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!draft) return;

    try {
      await updateProductDraft(draftId, {
        product: {
          ...draft.product,
          name: title,
          description,
          shortDescription,
          tags,
          specs,
          stockStatus,
        },
        adminChanges: [
          ...(draft.adminChanges || []),
          {
            field: 'multiple',
            originalValue: 'AI generated',
            newValue: 'Admin edited',
            timestamp: new Date(),
          },
        ],
      });

      setEditing(false);
      toast.success('Changes saved');
      loadDraft();
    } catch (error) {
      console.error('Error saving edits:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleCategoryApproved = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setShowCategoryDialog(false);
    toast.success('Category selected');
  };

  const handlePublish = async () => {
    if (!draft) return;

    // Validate required fields
    if (!title.trim()) {
      toast.error('Product title is required');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (!selectedCategoryId && !draft.suggestedCategory.categoryId) {
      toast.error('Please select or create a category first');
      setShowCategoryDialog(true);
      return;
    }

    setPublishing(true);

    try {
      // Create slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Create product
      const productId = await createProduct({
        name: title,
        slug,
        sku: sku || undefined,
        categoryId: selectedCategoryId || draft.suggestedCategory.categoryId!,
        tags,
        shortDescription,
        description,
        specs,
        productType: 'simple',
        price: parseFloat(price),
        isPriceVisible: true,
        images: draft.product.images,
        mainImageIndex: 0,
        stockStatus,
        videoUrl: draft.product.videoUrl,
        status: 'active',
        createdAt: new Date(),
      });

      // Update draft status
      await updateProductDraft(draftId, {
        status: 'published',
        publishedAt: new Date(),
      });

      toast.success('Product published successfully!');
      onPublished();
      
      // Navigate to product page
      setTimeout(() => {
        navigate(`/products/${slug}`);
      }, 1000);
    } catch (error: any) {
      console.error('Error publishing product:', error);
      toast.error(error.message || 'Failed to publish product');
      setPublishing(false);
    }
  };

  const handleDiscard = async () => {
    if (!confirm('Are you sure you want to discard this draft? This cannot be undone.')) {
      return;
    }

    try {
      await updateProductDraft(draftId, {
        status: 'discarded',
      });

      toast.success('Draft discarded');
      onClose();
    } catch (error) {
      console.error('Error discarding draft:', error);
      toast.error('Failed to discard draft');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-surface rounded-lg p-6">
          <p className="text-foreground">Loading draft...</p>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-surface rounded-lg p-6">
          <p className="text-destructive">Draft not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-accent text-white rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-screen py-8 px-4 flex items-center justify-center">
          <div className="bg-background rounded-2xl shadow-2xl max-w-5xl w-full border border-border">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-accent to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <div>
                    <h2 className="text-2xl font-bold">Review AI-Generated Product</h2>
                    <p className="text-sm opacity-90 mt-1">
                      Quality Score: {draft.aiMetadata.qualityScore}/100 | 
                      Cost: ₹{(draft.aiMetadata.qualityScore * 0.15).toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Warnings */}
            {draft.aiMetadata.warnings.length > 0 && (
              <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-600 mb-1">
                      AI Warnings:
                    </p>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-500 space-y-1">
                      {draft.aiMetadata.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Images */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Product Images ({draft.product.images.length})</h3>
                <div className="grid grid-cols-4 gap-4">
                  {draft.product.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Product ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg border border-border"
                    />
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-foreground mb-2">
                  Product Title <span className="text-destructive">*</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                  />
                ) : (
                  <p className="text-foreground text-lg">{title}</p>
                )}
              </div>

              {/* Price - ALWAYS REQUIRED */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <label className="block font-semibold text-foreground mb-2">
                  Price (INR) <span className="text-destructive">* REQUIRED</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price (e.g., 1299.99)"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-background border-2 border-yellow-500/40 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <p className="text-sm text-yellow-700 dark:text-yellow-600 mt-2">
                  ⚠️ AI cannot set prices. You must verify and enter the correct price.
                </p>
              </div>

              {/* SKU */}
              <div>
                <label className="block font-semibold text-foreground mb-2">SKU (Optional)</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Enter SKU"
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-foreground mb-2">
                  Category <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-foreground">
                      {selectedCategoryId ? (
                        <span className="text-green-600 font-medium">✓ Category selected</span>
                      ) : draft.suggestedCategory.categoryId ? (
                        <span className="text-blue-600">Using: {draft.suggestedCategory.path}</span>
                      ) : (
                        <span className="text-yellow-600">⚠️ Category approval required</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      AI Suggestion: {draft.suggestedCategory.path} ({(draft.suggestedCategory.confidence * 100).toFixed(0)}% confidence)
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCategoryDialog(true)}
                    className="px-4 py-2 bg-blue-accent text-white rounded-lg hover:bg-blue-accent/90 transition-colors"
                  >
                    {selectedCategoryId || draft.suggestedCategory.categoryId ? 'Change' : 'Select'} Category
                  </button>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block font-semibold text-foreground mb-2">Key Features</label>
                {editing ? (
                  <div className="space-y-2">
                    {shortDescription.map((feature, index) => (
                      <input
                        key={index}
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...shortDescription];
                          newFeatures[index] = e.target.value;
                          setShortDescription(newFeatures);
                        }}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground"
                      />
                    ))}
                  </div>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-foreground">
                    {shortDescription.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-foreground mb-2">Full Description</label>
                {editing ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent resize-none"
                  />
                ) : (
                  <div
                    className="prose prose-sm max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                )}
              </div>

              {/* Specifications */}
              <div>
                <label className="block font-semibold text-foreground mb-2">Specifications</label>
                <div className="bg-surface rounded-lg border border-border p-4">
                  <table className="w-full">
                    <tbody>
                      {Object.entries(specs).map(([key, value], index) => (
                        <tr key={index} className="border-b border-border last:border-0">
                          <td className="py-2 pr-4 text-muted-foreground font-medium">{key}</td>
                          <td className="py-2 text-foreground">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block font-semibold text-foreground mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-accent/10 text-blue-accent rounded-full text-sm border border-blue-accent/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stock Status */}
              <div>
                <label className="block font-semibold text-foreground mb-2">Stock Status</label>
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value as any)}
                  className="px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                >
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="preorder">Pre-order</option>
                </select>
              </div>

              {/* Source Info */}
              {draft.aiMetadata.sourceUrl && (
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Source:</p>
                  <a
                    href={draft.aiMetadata.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-accent hover:underline flex items-center gap-2 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {draft.aiMetadata.sourceUrl}
                  </a>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-border p-6 bg-muted/20 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  {editing ? (
                    <>
                      <button
                        onClick={handleSaveEdits}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          loadDraft();
                        }}
                        className="px-6 py-2 bg-surface border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="px-6 py-2 bg-surface border border-border text-foreground rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Details
                    </button>
                  )}
                  
                  <button
                    onClick={handleDiscard}
                    className="px-6 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-colors"
                  >
                    Discard Draft
                  </button>
                </div>

                <button
                  onClick={handlePublish}
                  disabled={publishing || !price || parseFloat(price) <= 0}
                  className="px-8 py-3 bg-gradient-to-r from-blue-accent to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                >
                  <Check className="w-5 h-5" />
                  {publishing ? 'Publishing...' : 'Approve & Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Approval Dialog */}
      {showCategoryDialog && (
        <CategoryApprovalDialog
          suggestion={draft.suggestedCategory}
          onApprove={handleCategoryApproved}
          onCancel={() => setShowCategoryDialog(false)}
        />
      )}
    </>
  );
}
