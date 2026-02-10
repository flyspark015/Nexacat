import { useParams, Link } from "react-router";
import { useState } from "react";
import { ChevronRight, ShoppingCart, MessageCircle, Download, Plus, Minus, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ProductCard } from "../components/ProductCard";
import { products, getProductById } from "../lib/mockData";
import { useCart } from "../lib/cartStore";
import { toast } from "sonner";

export function ProductDetailPage() {
  const { productId } = useParams();
  const product = products.find((p) => p.slug === productId);
  const addItem = useCart((state) => state.addItem);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Product not found</h2>
          <Button className="mt-4" asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${quantity}x ${product.name} added to cart`);
  };

  const handleWhatsAppEnquiry = () => {
    const message = `Hi, I'm interested in: ${product.name}\n${window.location.href}`;
    window.open(
      `https://wa.me/1234567890?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link
              to={`/category/${product.category}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {product.categoryName}
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Product Detail */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-2xl border bg-card">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === index
                        ? "border-blue-accent"
                        : "border-border hover:border-blue-accent/50"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Stock */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{product.categoryName}</Badge>
              {product.inStock ? (
                <Badge variant="outline" className="gap-1 border-success text-success">
                  <Check className="h-3 w-3" />
                  In Stock
                </Badge>
              ) : (
                <Badge variant="outline" className="border-destructive text-destructive">
                  Out of Stock
                </Badge>
              )}
              {product.featured && (
                <Badge className="bg-orange-accent text-orange-accent-foreground">
                  Featured
                </Badge>
              )}
            </div>

            {/* Name & Brand */}
            <div>
              <p className="mb-2 text-sm text-muted-foreground">{product.brand}</p>
              <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                {product.name}
              </h1>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Price */}
            <div className="rounded-xl border bg-muted/50 p-6">
              {product.price ? (
                <>
                  <p className="mb-1 text-sm text-muted-foreground">Price</p>
                  <p className="text-4xl font-bold text-foreground">
                    ${product.price.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Excluding taxes</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold text-blue-accent">
                    {product.priceLabel || "Request Quote"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Contact us for pricing information
                  </p>
                </>
              )}
            </div>

            {/* Quantity & Actions */}
            {product.inStock && (
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-sm font-medium">Quantity</Label>
                  <div className="flex w-fit items-center rounded-lg border">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="flex-1 gap-2 bg-blue-accent hover:bg-blue-accent/90"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2"
                    onClick={handleWhatsAppEnquiry}
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp Enquiry
                  </Button>
                </div>
              </div>
            )}

            {!product.inStock && (
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2"
                onClick={handleWhatsAppEnquiry}
              >
                <MessageCircle className="h-5 w-5" />
                Contact for Availability
              </Button>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <Tabs defaultValue="specifications" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            <TabsContent value="specifications" className="mt-6">
              <div className="rounded-xl border bg-card p-6">
                <h3 className="mb-4 text-xl font-semibold">Technical Specifications</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1 border-b pb-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        {key}
                      </span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                {product.datasheet && (
                  <Button variant="outline" className="mt-6 gap-2">
                    <Download className="h-4 w-4" />
                    Download Datasheet
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="features" className="mt-6">
              <div className="rounded-xl border bg-card p-6">
                <h3 className="mb-4 text-xl font-semibold">Key Features</h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-accent/10">
                        <Check className="h-3 w-3 text-blue-accent" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">Related Products</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  );
}
