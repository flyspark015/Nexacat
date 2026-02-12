import { useSearchParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ProductCard } from "../components/ProductCard";
import { searchProducts } from "../lib/firestoreService";
import { Product } from "../lib/types";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(queryParam);
    performSearch(queryParam);
  }, [queryParam]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    
    try {
      setLoading(true);
      const products = await searchProducts(searchTerm);
      setResults(products);
    } catch (error) {
      console.error("Error searching products:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    navigate("/search");
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
            Search Products
          </h1>
          
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by product name, category, brand, or tags..."
              className="h-14 pl-12 pr-24 text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                >
                  <X className="h-5 w-5" />
                </Button>
                <Button type="submit" size="sm" className="bg-blue-accent hover:bg-blue-accent/90">
                  Search
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Results */}
        {queryParam ? (
          <>
            <div className="mb-6">
              <p className="text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
                <span className="font-semibold text-foreground">"{queryParam}"</span>
              </p>
            </div>

            {results.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 text-6xl">🔍</div>
                <h3 className="mb-2 text-xl font-semibold">No products found</h3>
                <p className="mb-6 text-muted-foreground">
                  We couldn't find any products matching "{queryParam}"
                </p>
                <Button onClick={handleClear} variant="outline">
                  Clear Search
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h3 className="mb-2 text-xl font-semibold">Start Searching</h3>
            <p className="text-muted-foreground">
              Enter keywords to find products, categories, or brands
            </p>
          </div>
        )}
      </div>
    </div>
  );
}