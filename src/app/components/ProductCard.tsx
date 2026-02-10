import { Link } from "react-router";
import { ShoppingCart, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Product } from "../lib/mockData";
import { useCart } from "../lib/cartStore";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg"
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Category & Stock Badge */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs">
            {product.categoryName}
          </Badge>
          {product.inStock ? (
            <Badge variant="outline" className="text-xs text-success border-success">
              In Stock
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-destructive border-destructive">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Product Name */}
        <h3 className="line-clamp-2 font-semibold text-foreground">
          {product.name}
        </h3>

        {/* Description */}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.shortDescription}
        </p>

        {/* Tags */}
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

        {/* Price & Actions */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div>
            {product.price ? (
              <p className="text-xl font-bold text-foreground">
                ${product.price.toLocaleString()}
              </p>
            ) : (
              <p className="text-sm font-medium text-blue-accent">
                {product.priceLabel || "Request Quote"}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9"
              onClick={(e) => e.preventDefault()}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {product.inStock && (
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

      {/* Featured Badge */}
      {product.featured && (
        <div className="absolute right-3 top-3">
          <Badge className="bg-orange-accent text-orange-accent-foreground">
            Featured
          </Badge>
        </div>
      )}
    </Link>
  );
}
