import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Truck, Headphones, FileText, ShieldCheck, Package } from "lucide-react";
import { Button } from "../components/ui/button";
import { ProductCard } from "../components/ProductCard";
import { getCategories, getAllProducts, getSettings } from "../lib/firestoreService";
import { Category, Product, SystemSettings } from "../lib/types";
import { LoadingSpinner } from "../components/LoadingSpinner";

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryProductCounts, setCategoryProductCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, productsData, settingsData] = await Promise.all([
          getCategories(),
          getAllProducts(),
          getSettings(),
        ]);
        
        setCategories(categoriesData);
        setProducts(productsData.slice(0, 8)); // Show up to 8 featured products
        setSettings(settingsData);
        
        // Calculate product counts per category
        const counts: Record<string, number> = {};
        categoriesData.forEach(category => {
          counts[category.id] = productsData.filter(p => p.categoryId === category.id).length;
        });
        setCategoryProductCounts(counts);
      } catch (error) {
        console.error("Error loading homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const companyName = settings?.companyName || "FlySpark";

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary via-primary to-blue-accent/20">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
              {companyName}
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/90 md:text-xl">
              Premium B2B product catalog - Quality products for your business needs
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="gap-2 bg-white text-primary hover:bg-white/90"
                asChild
              >
                <Link to="/products">
                  Browse Products
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <Link to="/search">Search Catalog</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
      </section>

      {/* Categories Grid */}
      {categories.length > 0 && (
        <section className="border-b bg-background py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
              <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
                Shop by Category
              </h2>
              <p className="text-muted-foreground">
                Explore our wide range of professional products
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-xl"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-2xl font-bold">{category.name}</h3>
                      <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                        {categoryProductCounts[category.id] || 0} Products
                      </span>
                    </div>
                    <div className="flex items-center justify-end">
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="border-b bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
                  Featured Products
                </h2>
                <p className="text-muted-foreground">
                  Handpicked products for your business needs
                </p>
              </div>
              <Button variant="outline" asChild className="hidden sm:flex">
                <Link to="/products">View All</Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Button variant="outline" asChild className="w-full">
                <Link to="/products">View All Products</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {products.length === 0 && categories.length === 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-muted p-8">
                <Package className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold">No Products Yet</h3>
              <p className="mb-6 max-w-md text-muted-foreground">
                The catalog is being set up. Please check back soon or contact us for assistance.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              Why Choose {companyName}
            </h2>
            <p className="text-muted-foreground">
              Your trusted partner for B2B solutions
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-accent/10">
                <Truck className="h-8 w-8 text-blue-accent" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Quick delivery to your location with reliable logistics partners
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-accent/10">
                <Headphones className="h-8 w-8 text-orange-accent" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Direct Support</h3>
              <p className="text-sm text-muted-foreground">
                Dedicated support via WhatsApp for quick responses
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
                <FileText className="h-8 w-8 text-success" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Custom Quotation</h3>
              <p className="text-sm text-muted-foreground">
                Get personalized quotes for bulk orders and special requirements
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Quality Products</h3>
              <p className="text-sm text-muted-foreground">
                100% genuine products from authorized suppliers
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}