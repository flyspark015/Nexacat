import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { createCategory, updateCategory, getCategory } from "../../lib/firestoreService";
import { uploadFile } from "../../lib/storageService";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { toast } from "sonner";

export function AdminCategoryForm() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const isEditing = !!categoryId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    imageLocalPath: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    if (isEditing && categoryId) {
      loadCategory(categoryId);
    }
  }, [categoryId, isEditing]);

  const loadCategory = async (id: string) => {
    try {
      setLoading(true);
      const category = await getCategory(id);
      if (category) {
        setFormData({
          name: category.name,
          slug: category.slug,
          description: category.description || "",
          imageLocalPath: category.imageLocalPath || "",
        });
        setImagePreview(category.imageLocalPath || "");
      } else {
        toast.error("Category not found");
        navigate("/admin/categories");
      }
    } catch (error) {
      console.error("Error loading category:", error);
      toast.error("Failed to load category");
      navigate("/admin/categories");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData({ ...formData, imageLocalPath: "" });
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) {
      return formData.imageLocalPath;
    }

    try {
      setUploadingImage(true);
      const path = `categories/${Date.now()}_${imageFile.name}`;
      const downloadURL = await uploadFile(imageFile, path);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("Category slug is required");
      return;
    }

    setSaving(true);

    try {
      // Upload image if new file selected
      const imageUrl = await uploadImage();

      const categoryData = {
        ...formData,
        imageLocalPath: imageUrl,
      };

      if (isEditing && categoryId) {
        await updateCategory(categoryId, categoryData);
        toast.success("Category updated successfully!");
      } else {
        await createCategory(categoryData);
        toast.success("Category created successfully!");
      }

      navigate("/admin/categories");
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {isEditing ? "Edit Category" : "Add Category"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {isEditing
                  ? "Update category information"
                  : "Create a new product category"}
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/admin/categories")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Categories
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-accent"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Electronics, Fashion, Home & Garden"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Slug <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-accent"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="auto-generated-slug"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated from name, or customize manually. Used in URLs.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-accent"
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this category..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category Image
                </label>

                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Category preview"
                      className="h-48 w-auto rounded-lg border object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -right-2 -top-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-background px-6 py-4 transition-colors hover:bg-accent">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Upload Image</p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Image URL Fallback */}
                {!imagePreview && (
                  <div className="mt-4">
                    <label className="block text-xs font-medium mb-2 text-muted-foreground">
                      Or enter image URL
                    </label>
                    <input
                      type="url"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-accent"
                      value={formData.imageLocalPath}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          imageLocalPath: e.target.value,
                        });
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://example.com/category-image.jpg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-8 flex gap-4 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/admin/categories")}
                disabled={saving || uploadingImage}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={saving || uploadingImage}
              >
                {saving || uploadingImage ? (
                  <>
                    <LoadingSpinner size="sm" />
                    {uploadingImage ? "Uploading..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditing ? "Update Category" : "Create Category"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
