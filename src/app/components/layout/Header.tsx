import { Link, useNavigate } from "react-router";
import { Search, ShoppingCart, Menu, MessageCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useCart } from "../../lib/cartStore";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { categories } from "../../lib/mockData";

export function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const totalItems = useCart((state) => state.getTotalItems());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/1234567890?text=Hello, I need assistance", "_blank");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">TC</span>
            </div>
            <span className="hidden text-lg font-bold sm:inline-block">TechCatalog</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden flex-1 max-w-xl md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products, categories, brands..."
                className="w-full pl-10 bg-input-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* WhatsApp Button - Desktop */}
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 lg:flex"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden xl:inline">Contact</span>
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hidden md:inline-flex"
              asChild
            >
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 min-w-[1.25rem] px-1 bg-orange-accent text-orange-accent-foreground">
                    {totalItems}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link to="/" className="text-lg font-semibold">
                    Home
                  </Link>
                  <div className="border-t pt-4">
                    <p className="mb-3 text-sm font-semibold text-muted-foreground">
                      Categories
                    </p>
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        to={`/category/${category.slug}`}
                        className="block py-2 text-foreground hover:text-blue-accent"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <Button onClick={handleWhatsApp} className="w-full gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Contact on WhatsApp
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full pl-10 bg-input-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}
