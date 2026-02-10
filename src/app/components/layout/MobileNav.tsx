import { Link, useLocation } from "react-router";
import { Home, Grid3x3, Search, ShoppingCart, MessageCircle } from "lucide-react";
import { Badge } from "../ui/badge";
import { useCart } from "../../lib/cartStore";

export function MobileNav() {
  const location = useLocation();
  const totalItems = useCart((state) => state.getTotalItems());

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/1234567890?text=Hello, I need assistance", "_blank");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="grid h-16 grid-cols-5 items-center">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-1 ${
            isActive("/") ? "text-blue-accent" : "text-muted-foreground"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </Link>

        <Link
          to="/category/electronics"
          className={`flex flex-col items-center justify-center gap-1 ${
            isActive("/category") ? "text-blue-accent" : "text-muted-foreground"
          }`}
        >
          <Grid3x3 className="h-5 w-5" />
          <span className="text-xs">Categories</span>
        </Link>

        <Link
          to="/search"
          className={`flex flex-col items-center justify-center gap-1 ${
            isActive("/search") ? "text-blue-accent" : "text-muted-foreground"
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-xs">Search</span>
        </Link>

        <Link
          to="/cart"
          className={`relative flex flex-col items-center justify-center gap-1 ${
            isActive("/cart") ? "text-blue-accent" : "text-muted-foreground"
          }`}
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="text-xs">Cart</span>
          {totalItems > 0 && (
            <Badge className="absolute right-1/4 top-1 h-4 min-w-[1rem] px-1 text-xs bg-orange-accent text-orange-accent-foreground">
              {totalItems}
            </Badge>
          )}
        </Link>

        <button
          onClick={handleWhatsApp}
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs">WhatsApp</span>
        </button>
      </div>
    </nav>
  );
}
