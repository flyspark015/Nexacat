import { Link, useNavigate } from "react-router";
import { Search, ShoppingCart, Menu, MessageCircle, User, LogIn } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useCart } from "../../lib/cartStore";
import { useAuthStore } from "../../lib/authStore";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { getCategories, getSettings } from "../../lib/firestoreService";
import { SystemSettings, Category } from "../../lib/types";

export function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const totalItems = useCart((state) => state.getTotalItems());
  const { user, isAuthenticated, isAdmin } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, categoriesData] = await Promise.all([
        getSettings(),
        getCategories(),
      ]);
      setSettings(settingsData);
      setCategories(categoriesData);
    } catch (error: any) {
      // Silently use default settings if permission denied
      // This allows the app to work even without Firestore rules deployed
      if (error?.code === "permission-denied") {
        // Use default settings silently
        setSettings({
          id: "app-settings",
          companyName: "FlySpark",
          whatsappNumber: "+919876543210",
          currency: "INR",
          supportEmail: "seminest015@gmail.com",
        });
      } else {
        console.error("Error loading settings:", error);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleWhatsApp = () => {
    const whatsappNumber = settings?.whatsappNumber || "+919876543210";
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=Hello, I need assistance`, "_blank");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {settings?.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt={settings.companyName || "FlySpark"} 
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  // Fallback to default logo if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-primary ${settings?.logoUrl ? 'hidden' : ''}`}>
              <span className="text-lg font-bold text-primary-foreground">FS</span>
            </div>
            <span className="hidden text-lg font-bold sm:inline-block">
              {settings?.companyName || "FlySpark"}
            </span>
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

            {/* Auth Buttons */}
            {isAuthenticated() ? (
              <>
                {isAdmin() && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden md:flex"
                    asChild
                  >
                    <Link to="/admin">Admin</Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:inline-flex"
                  asChild
                >
                  <Link to="/profile">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex gap-2"
                asChild
              >
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}

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
                  
                  {/* Auth Links - Mobile */}
                  {isAuthenticated() ? (
                    <div className="border-t pt-4 space-y-2">
                      <Link
                        to="/profile"
                        className="block py-2 text-foreground hover:text-blue-accent"
                      >
                        My Profile
                      </Link>
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          className="block py-2 text-foreground hover:text-blue-accent"
                        >
                          Admin Panel
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="border-t pt-4 space-y-2">
                      <Link
                        to="/login"
                        className="block py-2 text-foreground hover:text-blue-accent"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="block py-2 text-foreground hover:text-blue-accent"
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}

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