import { Link } from "react-router";
import { useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { products } from "../../lib/mockData";

export function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Products</h1>
              <p className="mt-2 text-muted-foreground">
                Manage your product catalog
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link to="/admin/products/add">
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>

          {/* Search */}
          <div className="mt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Products Table */}
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-semibold">Product</th>
                  <th className="p-4 text-left font-semibold">Category</th>
                  <th className="p-4 text-left font-semibold">Brand</th>
                  <th className="p-4 text-left font-semibold">Price</th>
                  <th className="p-4 text-left font-semibold">Status</th>
                  <th className="p-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.shortDescription.slice(0, 50)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{product.categoryName}</Badge>
                    </td>
                    <td className="p-4 text-sm">{product.brand}</td>
                    <td className="p-4 text-sm font-medium">
                      {product.price ? `$${product.price.toLocaleString()}` : (
                        <span className="text-blue-accent">Quote</span>
                      )}
                    </td>
                    <td className="p-4">
                      {product.inStock ? (
                        <Badge variant="outline" className="border-success text-success">
                          In Stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-destructive text-destructive">
                          Out of Stock
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link to={`/admin/products/edit/${product.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 text-6xl">📦</div>
              <h3 className="mb-2 text-xl font-semibold">No products found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or add a new product
              </p>
            </div>
          )}
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
