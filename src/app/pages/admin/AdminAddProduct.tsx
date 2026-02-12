import { Link, useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Upload, Plus, X, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Progress } from "../../components/ui/progress";
import { toast } from "sonner";
import { Product, ProductVariation } from "../../lib/types";
import { getProduct, createProduct, updateProduct, getCategories } from "../../lib/firestoreService";
import { uploadProductImage, validateImageFile } from "../../lib/storageService";
import { generateSlug } from "../../lib/utils";

interface ImageUpload {
  url: string;
  file?: File;
  uploading?: boolean;
  progress?: number;
}

interface VariationForm {
  id: string;
  variationName: string;
  price: string;
  sku: string;
  variationImageIndex: string;
  status: "active" | "draft";
}

export function AdminAddProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!productId;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    categoryId: "",
    brand: "",
    sku: "",
    productType: "simple" as "simple" | "variable",
    price: "",
    isPriceVisible: true,
    stockStatus: "in-stock" as "in-stock" | "out-of-stock" | "preorder",
    videoUrl: "",
    description: "",
    status: "active" as "active" | "draft",
  });

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");

  const [variations, setVariations] = useState<VariationForm[]>([]);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Load product if editing
  useEffect(() => {
    if (isEditing && productId) {
      loadProduct(productId);
    }
  }, [productId, isEditing]);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadProduct = async (id: string) => {
    try {
      setLoading(true);
      const product = await getProduct(id);
      if (product) {
        setFormData({
          name: product.name,
          slug: product.slug,
          categoryId: product.categoryId,
          brand: product.brand || "",
          sku: product.sku || "",
          productType: product.productType,
          price: product.price?.toString() || "",
          isPriceVisible: product.isPriceVisible,
          stockStatus: product.stockStatus,
          videoUrl: product.videoUrl || "",
          description: product.description,
          status: product.status,
        });
        setTags(product.tags);
        setSpecs(product.specs);
        setImages(product.images.map(url => ({ url })));
        
        if (product.variations) {
          setVariations(
            product.variations.map(v => ({
              id: v.id,
              variationName: v.variationName,
              price: v.price.toString(),
              sku: v.sku || "",
              variationImageIndex: v.variationImageIndex?.toString() || "",
              status: v.status || "active",
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error loading product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from name
    if (name === "name") {
      setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  // Image handling
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        continue;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [
          ...prev,
          { url: event.target?.result as string, file, uploading: false, progress: 0 }
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const newImages = [...prev];
      const [moved] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, moved);
      return newImages;
    });
  };

  // Tags
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Specs
  const handleAddSpec = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setSpecs({ ...specs, [newSpecKey.trim()]: newSpecValue.trim() });
      setNewSpecKey("");
      setNewSpecValue("");
    }
  };

  const handleRemoveSpec = (key: string) => {
    const newSpecs = { ...specs };
    delete newSpecs[key];
    setSpecs(newSpecs);
  };

  // Variations
  const handleAddVariation = () => {
    setVariations([
      ...variations,
      {
        id: `new-${Date.now()}`,
        variationName: "",
        price: "",
        sku: "",
        variationImageIndex: "",
        status: "active",
      },
    ]);
  };

  const handleRemoveVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const handleVariationChange = (
    index: number,
    field: keyof VariationForm,
    value: string
  ) => {
    setVariations(prev =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.categoryId || !formData.slug) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.productType === "simple" && !formData.price && formData.isPriceVisible) {
      toast.error("Please enter a price for simple product or disable price visibility");
      return;
    }

    if (formData.productType === "variable" && variations.length === 0) {
      toast.error("Please add at least one variation for variable product");
      return;
    }

    if (formData.productType === "variable") {
      const invalidVariations = variations.filter(
        v => !v.variationName || !v.price
      );
      if (invalidVariations.length > 0) {
        toast.error("All variations must have a name and price");
        return;
      }
    }

    if (images.length === 0) {
      toast.error("Please add at least one product image");
      return;
    }

    try {
      setLoading(true);

      // Upload images first
      const uploadedImageUrls: string[] = [];
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        if (img.file) {
          // New image - upload it
          setUploadingImages(true);
          setImages(prev =>
            prev.map((im, idx) =>
              idx === i ? { ...im, uploading: true, progress: 0 } : im
            )
          );

          const tempProductId = isEditing ? productId : `temp-${Date.now()}`;
          
          const downloadUrl = await uploadProductImage(
            tempProductId!,
            img.file,
            (progress) => {
              setImages(prev =>
                prev.map((im, idx) =>
                  idx === i ? { ...im, progress } : im
                )
              );
            }
          );

          uploadedImageUrls.push(downloadUrl);
          
          setImages(prev =>
            prev.map((im, idx) =>
              idx === i ? { ...im, uploading: false, url: downloadUrl } : im
            )
          );
        } else {
          // Existing image - keep URL
          uploadedImageUrls.push(img.url);
        }
      }

      setUploadingImages(false);

      // Prepare product data
      const productData: Omit<Product, "id" | "createdAt"> = {
        name: formData.name,
        slug: formData.slug,
        categoryId: formData.categoryId,
        brand: formData.brand || undefined,
        sku: formData.sku || undefined,
        tags,
        description: formData.description,
        specs,
        productType: formData.productType,
        price: formData.productType === "simple" && formData.price 
          ? parseFloat(formData.price) 
          : undefined,
        isPriceVisible: formData.isPriceVisible,
        images: uploadedImageUrls,
        mainImageIndex: 0,
        stockStatus: formData.stockStatus,
        videoUrl: formData.videoUrl || undefined,
        status: formData.status,
      };

      // Prepare variations
      const variationsData: ProductVariation[] | undefined =
        formData.productType === "variable"
          ? variations.map(v => ({
              id: v.id,
              variationName: v.variationName,
              price: parseFloat(v.price),
              sku: v.sku || undefined,
              variationImageIndex: v.variationImageIndex
                ? parseInt(v.variationImageIndex)
                : undefined,
              status: v.status,
            }))
          : undefined;

      if (isEditing && productId) {
        await updateProduct(productId, productData, variationsData);
        toast.success("Product updated successfully!");
      } else {
        await createProduct(productData, variationsData);
        toast.success("Product created successfully!");
      }

      navigate("/admin/products");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" className="mb-4 gap-2" asChild>
            <Link to="/admin/products">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {isEditing ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isEditing
              ? "Update product information"
              : "Create a new product in your catalog"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-8">
          {/* Basic Information */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-6 text-xl font-semibold">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., DJI Mavic 3 Enterprise"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">
                  URL Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="e.g., dji-mavic-3-enterprise"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  Auto-generated from product name
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="categoryId">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={value =>
                      setFormData({ ...formData, categoryId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    name="brand"
                    placeholder="e.g., DJI"
                    value={formData.brand}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    name="sku"
                    placeholder="e.g., PROD-001"
                    value={formData.sku}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="stockStatus">
                    Stock Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.stockStatus}
                    onValueChange={value =>
                      setFormData({
                        ...formData,
                        stockStatus: value as any,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                      <SelectItem value="preorder">Pre-order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Product Type & Pricing */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-6 text-xl font-semibold">Product Type & Pricing</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="productType">
                  Product Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.productType}
                  onValueChange={value =>
                    setFormData({
                      ...formData,
                      productType: value as "simple" | "variable",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple Product</SelectItem>
                    <SelectItem value="variable">Variable Product</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formData.productType === "simple"
                    ? "Single price product"
                    : "Product with multiple variations"}
                </p>
              </div>

              {formData.productType === "simple" && (
                <>
                  <div>
                    <Label htmlFor="price">Price (INR ₹)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isPriceVisible">Show Price</Label>
                      <p className="text-sm text-muted-foreground">
                        Display price on product page
                      </p>
                    </div>
                    <Switch
                      id="isPriceVisible"
                      checked={formData.isPriceVisible}
                      onCheckedChange={checked =>
                        setFormData({ ...formData, isPriceVisible: checked })
                      }
                    />
                  </div>
                </>
              )}

              {formData.productType === "variable" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Variations</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddVariation}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Variation
                    </Button>
                  </div>

                  {variations.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No variations yet. Click "Add Variation" to create one.
                    </p>
                  )}

                  {variations.map((variation, index) => (
                    <div
                      key={variation.id}
                      className="rounded-lg border bg-muted/50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Variation {index + 1}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveVariation(index)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>
                            Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            placeholder="e.g., 64GB Blue"
                            value={variation.variationName}
                            onChange={e =>
                              handleVariationChange(
                                index,
                                "variationName",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div>
                          <Label>
                            Price (₹) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={variation.price}
                            onChange={e =>
                              handleVariationChange(index, "price", e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <Label>SKU</Label>
                          <Input
                            placeholder="VAR-001"
                            value={variation.sku}
                            onChange={e =>
                              handleVariationChange(index, "sku", e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <Label>Image Index (optional)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={variation.variationImageIndex}
                            onChange={e =>
                              handleVariationChange(
                                index,
                                "variationImageIndex",
                                e.target.value
                              )
                            }
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Which product image to show (0 = first)
                          </p>
                        </div>

                        <div>
                          <Label>Status</Label>
                          <Select
                            value={variation.status}
                            onValueChange={value =>
                              handleVariationChange(
                                index,
                                "status",
                                value as "active" | "draft"
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-6 text-xl font-semibold">Product Images</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="image-upload">
                  Upload Images <span className="text-destructive">*</span>
                </Label>
                <div className="mt-2">
                  <label
                    htmlFor="image-upload"
                    className="flex h-48 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors hover:border-blue-accent/50 hover:bg-accent/5"
                  >
                    <div className="text-center">
                      <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </div>
              </div>

              {images.length > 0 && (
                <div>
                  <Label>Uploaded Images ({images.length})</Label>
                  <div className="mt-2 grid gap-4 sm:grid-cols-3">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="group relative overflow-hidden rounded-lg border"
                      >
                        <div className="aspect-square bg-muted">
                          <img
                            src={image.url}
                            alt={`Product ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {image.uploading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                            <p className="mb-2 text-sm">Uploading...</p>
                            <Progress value={image.progress || 0} className="w-3/4" />
                          </div>
                        )}

                        {!image.uploading && (
                          <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            {index > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 rounded-full p-0"
                                onClick={() => moveImage(index, index - 1)}
                              >
                                ←
                              </Button>
                            )}
                            {index < images.length - 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 rounded-full p-0"
                                onClick={() => moveImage(index, index + 1)}
                              >
                                →
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 rounded-full p-0"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        <div className="absolute bottom-2 left-2">
                          <span className="rounded-full bg-background/80 px-2 py-1 text-xs font-medium backdrop-blur-sm">
                            #{index}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    First image will be the main product image. Use arrows to reorder.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-6 text-xl font-semibold">Description</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="description">
                  Product Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Detailed product description"
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="videoUrl">YouTube Video URL (optional)</Label>
                <Input
                  id="videoUrl"
                  name="videoUrl"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.videoUrl}
                  onChange={handleChange}
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  Embed a product video from YouTube
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-6 text-xl font-semibold">Tags</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="newTag">Add Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="newTag"
                    placeholder="e.g., Professional"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyPress={e =>
                      e.key === "Enter" && (e.preventDefault(), handleAddTag())
                    }
                  />
                  <Button type="button" onClick={handleAddTag} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-6 text-xl font-semibold">Specifications</h2>

            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-[1fr,1fr,auto]">
                <Input
                  placeholder="Spec name (e.g., Weight)"
                  value={newSpecKey}
                  onChange={e => setNewSpecKey(e.target.value)}
                />
                <Input
                  placeholder="Value (e.g., 895g)"
                  value={newSpecValue}
                  onChange={e => setNewSpecValue(e.target.value)}
                  onKeyPress={e =>
                    e.key === "Enter" && (e.preventDefault(), handleAddSpec())
                  }
                />
                <Button type="button" onClick={handleAddSpec} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              {Object.keys(specs).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(specs).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg border bg-muted/50 p-3"
                    >
                      <div>
                        <span className="font-medium">{key}:</span>{" "}
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveSpec(key)}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-6 text-xl font-semibold">Settings</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="status">Product Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Only active products are visible on the site
                  </p>
                </div>
                <Select
                  value={formData.status}
                  onValueChange={value =>
                    setFormData({ ...formData, status: value as "active" | "draft" })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="submit"
              size="lg"
              className="gap-2"
              disabled={loading || uploadingImages}
            >
              {loading
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update Product"
                : "Create Product"}
            </Button>
            <Button type="button" variant="outline" size="lg" asChild>
              <Link to="/admin/products">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
