import { RouterProvider } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./lib/AuthProvider";
import { router } from "./routes";
import { FirebaseStatus } from "./components/FirebaseStatus";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
      <FirebaseStatus />
    </AuthProvider>
  );
}