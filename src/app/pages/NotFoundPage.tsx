import { Link } from "react-router";
import { Home, Search } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-8 text-9xl font-bold text-blue-accent">404</div>
        <h1 className="mb-4 text-3xl font-bold tracking-tight">Page Not Found</h1>
        <p className="mb-8 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/search">
              <Search className="h-4 w-4" />
              Search Products
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
