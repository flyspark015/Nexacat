import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import {
  ChevronRight,
  ShoppingCart,
  MessageCircle,
  Plus,
  Minus,
  Check,
  Share2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ProductCard } from "../components/ProductCard";
import { useCart } from "../lib/cartStore";
import { toast } from "sonner";
import {
  getProductBySlug,
  getProductsByCategory,
  getCategory,
  getSettings,
} from "../lib/firestoreService";
import { Product, ProductVariation, SystemSettings } from "../lib/types";
import {
  formatPrice,
  getStockStatusBadge,
  getYouTubeVideoId,
  generateWhatsAppProductMessage,
  getWhatsAppLink,
} from "../lib/utils";

export function ProductDetailPage() {
  const { productId } = useParams();
  const addItem = useCart((state) => state.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(
    null
  );

  useEffect(() => {
    if (productId) {
      loadProduct(productId);
      loadSettings();
    }
  }, [productId]);

  const loadProduct = async (slug: string) => {
    try {
      setLoading(true);
      const prod = await getProductBySlug(slug);

      if (prod) {
        setProduct(prod);

        // Auto-select first active variation for variable products
        if (prod.productType === "variable" && prod.variations) {
          const firstActive = prod.variations.find((v) => v.status !== "draft");
          if (firstActive) {
            setSelectedVariation(firstActive);
            // Switch to variation image if specified
            if (
              firstActive.variationImageIndex !== undefined &&
              prod.images[firstActive.variationImageIndex]
            ) {
              setSelectedImage(firstActive.variationImageIndex);
            }
          }
        }

        // Load category
        const cat = await getCategory(prod.categoryId);
        setCategory(cat);

        // Load related products
        const related = await getProductsByCategory(prod.categoryId);
        setRelatedProducts(related.filter((p) => p.id !== prod.id).slice(0, 4));
      }
    } catch (error) {
      console.error("Error loading product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const sett = await getSettings();
      setSettings(sett);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleVariationChange = (variationId: string) => {
    if (!product || !product.variations) return;

    const variation = product.variations.find((v) => v.id === variationId);
    if (variation) {
      setSelectedVariation(variation);

      // Switch image if variation has a specific image
      if (
        variation.variationImageIndex !== undefined &&
        product.images[variation.variationImageIndex]
      ) {
        setSelectedImage(variation.variationImageIndex);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    const stockStatus = product.stockStatus;

    if (stockStatus === "out-of-stock") {
      toast.error("Product is out of stock");
      return;
    }

    if (product.productType === "variable" && !selectedVariation) {
      toast.error("Please select a variation");
      return;
    }

    const primaryImage = product.images?.[0] || "/placeholder-product.png";
    
    if (product.productType === "simple" && product.price) {
      addItem({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productType: "simple",
        price: product.price,
        quantity,
        sku: product.sku,
        imageLocalPath: primaryImage,
      });
      toast.success(`${quantity}x ${product.name} added to cart`);
    } else if (product.productType === "variable" && selectedVariation) {
      addItem({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productType: "variable",
        variationId: selectedVariation.id,
        variationName: selectedVariation.variationName,
        price: selectedVariation.price,
        quantity,
        sku: selectedVariation.sku,
        imageLocalPath: primaryImage,
      });
      toast.success(
        `${quantity}x ${product.name} (${selectedVariation.variationName}) added to cart`
      );
    }

    setQuantity(1);
  };

  const handleWhatsAppEnquiry = () => {
    if (!product || !settings) return;

    let productName = product.name;
    if (selectedVariation) {
      productName += ` (${selectedVariation.variationName})`;
    }

    const message = generateWhatsAppProductMessage({
      name: productName,
      price: selectedVariation?.price || product.price,
      productUrl: window.location.href,
    });

    const whatsappLink = getWhatsAppLink(settings.whatsappNumber, message);
    window.open(whatsappLink, "_blank");
  };

  const handleShare = () => {
    if (!product) return;

    const message = generateWhatsAppProductMessage({
      name: product.name,
      price: selectedVariation?.price || product.price,
      productUrl: window.location.href,
    });

    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          text: message,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${product.name}\n${window.location.href}`);
      toast.success("Product link copied to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

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

  const stockBadge = getStockStatusBadge(product.stockStatus);
  const primaryImage = product.images?.[selectedImage] || "/placeholder-product.png";
  const videoId = product.videoUrl ? getYouTubeVideoId(product.videoUrl) : null;

  // Calculate current price
  const currentPrice =
    product.productType === "variable" && selectedVariation
      ? selectedVariation.price
      : product.price || 0;

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
            {category && (
              <>
                <Link
                  to={`/category/${category.slug}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {category.name}
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </>
            )}
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
                src={primaryImage}
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

            {/* YouTube Video */}
            {videoId && (
              <div className="aspect-video overflow-hidden rounded-2xl border bg-card">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Product video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Stock */}
            <div className="flex items-center gap-2">
              {category && <Badge variant="secondary">{category.name}</Badge>}
              <Badge variant="outline" className={stockBadge.className}>
                {stockBadge.text}
              </Badge>
              {product.productType === "variable" && (
                <Badge className="bg-orange-accent text-orange-accent-foreground">
                  Multiple Options
                </Badge>
              )}
            </div>

            {/* Product Title */}
            <div>
              {product.brand && (
                <p className="mb-2 text-sm text-muted-foreground">{product.brand}</p>
              )}
              <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                {product.name}
              </h1>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
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
            )}

            {/* Variations */}
            {product.productType === "variable" &&
              product.variations &&
              product.variations.length > 0 && (
                <div className="rounded-xl border bg-muted/50 p-6">
                  <Label className="mb-3 block text-base font-semibold">
                    Select Variation
                  </Label>
                  <RadioGroup
                    value={selectedVariation?.id}
                    onValueChange={handleVariationChange}
                  >
                    {product.variations
                      .filter((v) => v.status !== "draft")
                      .map((variation) => (
                        <div
                          key={variation.id}
                          className="flex items-center space-x-3 rounded-lg border bg-background p-3"
                        >
                          <RadioGroupItem
                            value={variation.id}
                            id={variation.id}
                          />
                          <Label
                            htmlFor={variation.id}
                            className="flex flex-1 cursor-pointer items-center justify-between"
                          >
                            <span>{variation.variationName}</span>
                            <span className="font-semibold">
                              {formatPrice(variation.price)}
                            </span>
                          </Label>
                        </div>
                      ))}
                  </RadioGroup>
                </div>
              )}

            {/* Price */}
            {product.isPriceVisible && (
              <div className="rounded-xl border bg-muted/50 p-6">
                <p className="mb-1 text-sm text-muted-foreground">Price</p>
                <p className="text-4xl font-bold text-foreground">
                  {formatPrice(currentPrice)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Excluding taxes</p>
                {product.sku && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    SKU: {selectedVariation?.sku || product.sku}
                  </p>
                )}
              </div>
            )}

            {!product.isPriceVisible && (
              <div className="rounded-xl border bg-muted/50 p-6">
                <p className="text-2xl font-semibold text-blue-accent">
                  Request Quote
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Contact us for pricing information
                </p>
              </div>
            )}

            {/* Quantity & Actions */}
            {product.stockStatus !== "out-of-stock" && (
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
                    WhatsApp
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {product.stockStatus === "out-of-stock" && (
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

            {/* Short Description - Below Add to Cart */}
            {product.shortDescription && product.shortDescription.length > 0 && (
              <div className="rounded-xl border bg-card p-6">
                <h3 className="mb-3 text-lg font-semibold">Key Features</h3>
                <ul className="space-y-2">
                  {product.shortDescription.map((desc, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-accent" />
                      <span>{desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        {(Object.keys(product.specs).length > 0 || product.description || product.tags.length > 0) && (
          <div className="mt-16">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="description">Detailed Description</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <div className="rounded-xl border bg-card p-6">
                  <h3 className="mb-4 text-xl font-semibold">
                    About this Product
                  </h3>
                  {product.description ? (
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="whitespace-pre-wrap">{product.description}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No detailed description available
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="mt-6">
                <div className="rounded-xl border bg-card p-6">
                  <h3 className="mb-4 text-xl font-semibold">
                    Technical Specifications
                  </h3>
                  {Object.keys(product.specs).length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {Object.entries(product.specs).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1 border-b pb-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            {key}
                          </span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No specifications available
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">
              Related Products
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  categoryName={category?.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}