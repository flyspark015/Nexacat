import { Link } from "react-router";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { categories } from "../../lib/mockData";

export function AdminCategories() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Categories</h1>
              <p className="mt-2 text-muted-foreground">
                Manage product categories
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Categories Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="mb-1 text-xl font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                
                <Badge variant="secondary" className="mb-4">
                  {category.productCount} Products
                </Badge>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Back Navigation */}
        <div className="mt-8 flex gap-4">
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
