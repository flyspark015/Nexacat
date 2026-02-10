import { Link } from "react-router";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Grid3x3,
  FileText,
  Plus,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { products, categories } from "../../lib/mockData";

export function AdminDashboard() {
  const totalProducts = products.length;
  const inStockProducts = products.filter((p) => p.inStock).length;
  const totalCategories = categories.length;
  
  // Mock stats
  const stats = [
    {
      label: "Total Products",
      value: totalProducts,
      icon: Package,
      color: "bg-blue-accent/10 text-blue-accent",
    },
    {
      label: "Categories",
      value: totalCategories,
      icon: Grid3x3,
      color: "bg-orange-accent/10 text-orange-accent",
    },
    {
      label: "In Stock",
      value: inStockProducts,
      icon: ShoppingCart,
      color: "bg-success/10 text-success",
    },
    {
      label: "Out of Stock",
      value: totalProducts - inStockProducts,
      icon: TrendingUp,
      color: "bg-destructive/10 text-destructive",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage your catalog and orders
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link to="/admin/products/add">
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/admin/products"
              className="group flex flex-col gap-3 rounded-xl border bg-card p-6 transition-all hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-accent/10 text-blue-accent">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-blue-accent">
                  Manage Products
                </h3>
                <p className="text-sm text-muted-foreground">
                  View and edit products
                </p>
              </div>
            </Link>

            <Link
              to="/admin/products/add"
              className="group flex flex-col gap-3 rounded-xl border bg-card p-6 transition-all hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-success">Add Product</h3>
                <p className="text-sm text-muted-foreground">
                  Create new product
                </p>
              </div>
            </Link>

            <Link
              to="/admin/categories"
              className="group flex flex-col gap-3 rounded-xl border bg-card p-6 transition-all hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-accent/10 text-orange-accent">
                <Grid3x3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-orange-accent">
                  Categories
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage categories
                </p>
              </div>
            </Link>

            <Link
              to="/admin/orders"
              className="group flex flex-col gap-3 rounded-xl border bg-card p-6 transition-all hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary">
                  View Orders
                </h3>
                <p className="text-sm text-muted-foreground">
                  Check enquiries
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Products */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Products</h2>
            <Button variant="outline" asChild>
              <Link to="/admin/products">View All</Link>
            </Button>
          </div>

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
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 5).map((product) => (
                    <tr key={product.id} className="border-b last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.shortDescription.slice(0, 40)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{product.categoryName}</td>
                      <td className="p-4 text-sm">{product.brand}</td>
                      <td className="p-4 text-sm font-medium">
                        {product.price ? `$${product.price}` : "Quote"}
                      </td>
                      <td className="p-4">
                        {product.inStock ? (
                          <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
                            In Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                            Out of Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Back to Store */}
        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link to="/">← Back to Store</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
