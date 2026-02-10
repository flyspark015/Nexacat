import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { HomePage } from "./pages/HomePage";
import { CategoryPage } from "./pages/CategoryPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { SearchPage } from "./pages/SearchPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminAddProduct } from "./pages/admin/AdminAddProduct";
import { AdminCategories } from "./pages/admin/AdminCategories";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "category/:categoryId", Component: CategoryPage },
      { path: "product/:productId", Component: ProductDetailPage },
      { path: "search", Component: SearchPage },
      { path: "cart", Component: CartPage },
      { path: "checkout", Component: CheckoutPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
  {
    path: "/admin",
    children: [
      { index: true, Component: AdminDashboard },
      { path: "products", Component: AdminProducts },
      { path: "products/add", Component: AdminAddProduct },
      { path: "products/edit/:productId", Component: AdminAddProduct },
      { path: "categories", Component: AdminCategories },
      { path: "orders", Component: AdminOrders },
    ],
  },
]);
