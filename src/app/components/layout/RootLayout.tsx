import { Outlet } from "react-router";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
