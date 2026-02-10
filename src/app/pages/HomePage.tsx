import { Link } from "react-router";
import { ArrowRight, Truck, Headphones, FileText, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/button";
import { ProductCard } from "../components/ProductCard";
import { categories, getFeaturedProducts } from "../lib/mockData";

export function HomePage() {
  const featuredProducts = getFeaturedProducts();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary via-primary to-blue-accent/20">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
              Digital Product Catalog
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/90 md:text-xl">
              Premium electronics, industrial equipment, and technology solutions for B2B buyers
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="gap-2 bg-white text-primary hover:bg-white/90"
                asChild
              >
                <Link to="/category/electronics">
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
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="mb-2 text-2xl font-bold">{category.name}</h3>
                  <p className="mb-3 text-sm text-white/80">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {category.productCount} Products
                    </span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
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
              <Link to="/category/electronics">View All</Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild className="w-full">
              <Link to="/category/electronics">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              Why Choose TechCatalog
            </h2>
            <p className="text-muted-foreground">
              Your trusted partner for B2B technology solutions
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-accent/10">
                <Truck className="h-8 w-8 text-blue-accent" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Fast Shipping</h3>
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
                Dedicated technical support via WhatsApp and email
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
              <h3 className="mb-2 text-xl font-semibold">Genuine Products</h3>
              <p className="text-sm text-muted-foreground">
                100% authentic products from authorized distributors
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="mb-4 text-lg font-semibold">About TechCatalog</h4>
              <p className="text-sm text-muted-foreground">
                Your trusted partner for B2B electronics and industrial equipment.
                Serving businesses worldwide with premium products.
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-lg font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-blue-accent">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/category/electronics"
                    className="text-muted-foreground hover:text-blue-accent"
                  >
                    All Products
                  </Link>
                </li>
                <li>
                  <Link to="/search" className="text-muted-foreground hover:text-blue-accent">
                    Search
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-lg font-semibold">Categories</h4>
              <ul className="space-y-2 text-sm">
                {categories.slice(0, 4).map((category) => (
                  <li key={category.id}>
                    <Link
                      to={`/category/${category.slug}`}
                      className="text-muted-foreground hover:text-blue-accent"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-lg font-semibold">Contact Us</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Email: info@techcatalog.com</li>
                <li>Phone: +1 (234) 567-8900</li>
                <li>WhatsApp: +1 234 567 8900</li>
                <li>Mon-Fri: 9:00 AM - 6:00 PM</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 TechCatalog. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
