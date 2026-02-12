import { Link } from "react-router";
import { ShoppingCart, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Product } from "../lib/types";
import { useCart } from "../lib/cartStore";
import { toast } from "sonner";
import { formatPrice, getStockStatusBadge } from "../lib/utils";

interface ProductCardProps {
  product: Product;
  categoryName?: string;
}

export function ProductCard({ product, categoryName }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  
  // Handle both old mock data structure and new Firebase structure
  // Safely get stock status with default fallback
  const stockStatus = product.stockStatus || ((product as any).inStock !== false ? "in-stock" : "out-of-stock");
  const stockBadge = getStockStatusBadge(stockStatus);
  
  // Get category name - handle both old mock data and new Firebase structure
  const category = categoryName || (product as any).categoryName || (product as any).category || "Product";
  
  // Get primary image - handle both old and new structure
  const primaryImage = 
    product.images?.[0] || 
    product.imagesLocalPaths?.[0] || 
    (product as any).image || 
    (product as any).images?.[0] || 
    "/placeholder-product.png";
  
  // Calculate price for display
  let displayPrice = 0;
  let priceRange = "";
  let isVariableProduct = false;
  
  if (product.productType === "variable" && product.variations && product.variations.length > 0) {
    isVariableProduct = true;
    const prices = product.variations
      .filter(v => v.status !== "draft")
      .map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      displayPrice = minPrice;
    } else {
      priceRange = `₹${minPrice.toLocaleString("en-IN")} – ₹${maxPrice.toLocaleString("en-IN")}`;
    }
  } else if (product.productType === "simple" && product.price) {
    displayPrice = product.price;
  } else {
    // Fallback for old mock data
    displayPrice = (product as any).price || 0;
  }
  
  // Get product type with default
  const productType = product.productType || "simple";
    
  // Determine if product can be added to cart
  const canAddToCart = stockStatus !== "out-of-stock" && 
                       productType === "simple" && 
                       displayPrice > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (stockStatus === "out-of-stock") {
      toast.error("Product is out of stock");
      return;
    }

    // For variable products, redirect to product page to select variation
    if (isVariableProduct) {
      return; // Let the Link handle navigation
    }

    // For simple products, add directly to cart
    if (displayPrice > 0) {
      addItem({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productType: "simple",
        price: displayPrice,
        imageLocalPath: primaryImage,
      });
      toast.success(`${product.name} added to cart`);
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-all hover:shadow-lg hover:shadow-blue-accent/10">
      {/* Product Type Badge for Variable Products */}
      {isVariableProduct && (
        <div className="absolute left-3 top-3 z-10">
          <Badge className="bg-orange-accent text-orange-accent-foreground">
            Multiple Options
          </Badge>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="absolute right-2 top-2 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Link to={`/product/${product.slug}`}>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 rounded-full p-0 bg-background/90 backdrop-blur-sm hover:bg-background"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
        {!isVariableProduct && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAddToCart}
            className="h-8 w-8 rounded-full p-0 bg-background/90 backdrop-blur-sm hover:bg-background"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Image */}
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={primaryImage}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Category & Stock Badge */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          <Badge variant="outline" className={`text-xs ${stockBadge.className}`}>
            {stockBadge.text}
          </Badge>
        </div>

        {/* Product Name */}
        <h3 className="line-clamp-2 font-semibold text-foreground">
          {product.name}
        </h3>

        {/* Description */}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price & Actions */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div className="font-semibold">
            {priceRange ? (
              <span className="text-sm">{priceRange}</span>
            ) : (
              formatPrice(displayPrice)
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9"
              onClick={(e) => e.preventDefault()}
              asChild
            >
              <Link to={`/product/${product.slug}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            {canAddToCart && (
              <Button
                size="icon"
                className="h-9 w-9 bg-blue-accent hover:bg-blue-accent/90 text-blue-accent-foreground"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}