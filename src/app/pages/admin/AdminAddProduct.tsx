import { Link, useParams } from "react-router";
import { useState } from "react";
import { ArrowLeft, Upload, Plus, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { categories, getProductById } from "../../lib/mockData";
import { toast } from "sonner";

export function AdminAddProduct() {
  const { productId } = useParams();
  const existingProduct = productId ? getProductById(productId) : null;
  const isEditing = !!existingProduct;

  const [formData, setFormData] = useState({
    name: existingProduct?.name || "",
    slug: existingProduct?.slug || "",
    category: existingProduct?.category || "",
    brand: existingProduct?.brand || "",
    price: existingProduct?.price?.toString() || "",
    shortDescription: existingProduct?.shortDescription || "",
    description: existingProduct?.description || "",
    inStock: existingProduct?.inStock ?? true,
    featured: existingProduct?.featured ?? false,
  });

  const [tags, setTags] = useState<string[]>(existingProduct?.tags || []);
  const [newTag, setNewTag] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.brand) {
      toast.error("Please fill in all required fields");
      return;
    }

    // In a real app, this would make an API call
    toast.success(isEditing ? "Product updated successfully!" : "Product created successfully!");
    
    // Reset form if creating new product
    if (!isEditing) {
      setFormData({
        name: "",
        slug: "",
        category: "",
        brand: "",
        price: "",
        shortDescription: "",
        description: "",
        inStock: true,
        featured: false,
      });
      setTags([]);
    }
  };

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
            {isEditing ? "Update product information" : "Create a new product in your catalog"}
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
                  Used in the product URL. Use lowercase and hyphens.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="brand">
                    Brand <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="brand"
                    name="brand"
                    placeholder="e.g., DJI"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="Leave empty for 'Request Quote'"
                  value={formData.price}
                  onChange={handleChange}
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  Leave empty to show "Request Quote" instead of price
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-6 text-xl font-semibold">Description</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="shortDescription">
                  Short Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="shortDescription"
                  name="shortDescription"
                  placeholder="Brief product description (1-2 lines)"
                  rows={2}
                  value={formData.shortDescription}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">
                  Full Description <span className="text-destructive">*</span>
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
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
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

          {/* Images */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-6 text-xl font-semibold">Product Images</h2>
            
            <div className="space-y-4">
              <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed">
                <div className="text-center">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Note: Image upload is a demo feature. In production, this would upload to a storage service.
              </p>
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-6 text-xl font-semibold">Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="inStock">In Stock</Label>
                  <p className="text-sm text-muted-foreground">
                    Product is available for purchase
                  </p>
                </div>
                <Switch
                  id="inStock"
                  checked={formData.inStock}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, inStock: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="featured">Featured Product</Label>
                  <p className="text-sm text-muted-foreground">
                    Show on homepage and category highlights
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, featured: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" size="lg" className="gap-2">
              {isEditing ? "Update Product" : "Create Product"}
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
