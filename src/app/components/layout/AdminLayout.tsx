import { Link, useNavigate, useLocation } from "react-router";
import { useAuthStore } from "../../lib/authStore";
import { signOut } from "../../lib/authService";
import { Button } from "../ui/button";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  LogOut,
  Home,
  Zap,
  Settings,
  MessageSquare,
  Bot,
} from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { path: "/admin/ai", label: "AI", icon: Bot, badge: "New" },
    { path: "/admin/products", label: "Products", icon: Package },
    { path: "/admin/categories", label: "Categories", icon: FolderTree },
    { path: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { path: "/admin/users", label: "Users", icon: Users },
    { path: "/admin/faqs", label: "FAQs", icon: MessageSquare },
    { path: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex md:flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-accent to-orange-accent rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">FlySpark</h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? "bg-blue-accent text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User & Actions */}
        <div className="p-4 border-t border-border">
          <div className="mb-3 px-4 py-2 bg-muted rounded-lg">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>

          <Link to="/">
            <Button variant="outline" className="w-full mb-2">
              <Home className="w-4 h-4 mr-2" />
              Back to Store
            </Button>
          </Link>

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-accent to-orange-accent rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold">Admin</h2>
          </Link>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <Home className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:mt-0 mt-16">
        {children}
      </main>
    </div>
  );
}
