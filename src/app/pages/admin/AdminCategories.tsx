import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, FolderOpen } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { getCategories, deleteCategory } from "../../lib/firestoreService";
import { Category } from "../../lib/types";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { toast } from "sonner";

export function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCategories(categories);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCategories(
        categories.filter(
          (cat) =>
            cat.name.toLowerCase().includes(query) ||
            cat.slug.toLowerCase().includes(query) ||
            cat.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const cats = await getCategories();
      setCategories(cats);
      setFilteredCategories(cats);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      setDeleting(id);
      await deleteCategory(id);
      toast.success("Category deleted successfully!");
      await loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setDeleting(null);
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
                Categories
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage product categories for your store
              </p>
            </div>
            <Button
              className="gap-2"
              onClick={() => navigate("/admin/categories/add")}
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search categories..."
                className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-accent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-accent/10 p-3">
                <FolderOpen className="h-5 w-5 text-blue-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Categories
                </p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {searchQuery ? "No categories found" : "No categories yet"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by creating your first category"}
            </p>
            {!searchQuery && (
              <Button
                className="mt-4 gap-2"
                onClick={() => navigate("/admin/categories/add")}
              >
                <Plus className="h-4 w-4" />
                Add Your First Category
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg"
              >
                {/* Category Image */}
                <div className="aspect-video overflow-hidden bg-muted">
                  {category.imageLocalPath ? (
                    <img
                      src={category.imageLocalPath}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-accent/20 to-purple-500/20">
                      <FolderOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Category Info */}
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="mb-1 text-lg font-semibold line-clamp-1">
                      {category.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      /{category.slug}
                    </p>
                    {category.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() =>
                        navigate(`/admin/categories/edit/${category.id}`)
                      }
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(category.id, category.name)}
                      disabled={deleting === category.id}
                    >
                      {deleting === category.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Button variant="outline" asChild>
            <Link to="/admin">← Back to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">View Store</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
