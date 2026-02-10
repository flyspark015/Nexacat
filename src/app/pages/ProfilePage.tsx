import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../lib/authStore";
import { signOut } from "../lib/authService";
import { getOrders } from "../lib/firestoreService";
import { Order } from "../lib/types";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";
import { User, Mail, LogOut, Package, Calendar } from "lucide-react";
import { format } from "date-fns";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const fetchOrders = async () => {
      if (user) {
        const userOrders = await getOrders(user.uid);
        setOrders(userOrders);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user, isAuthenticated, navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to log out");
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "NEW":
        return "bg-blue-accent/10 text-blue-accent border-blue-accent/20";
      case "CONTACTED":
        return "bg-warning/10 text-warning border-warning/20";
      case "QUOTED":
        return "bg-orange-accent/10 text-orange-accent border-orange-accent/20";
      case "CLOSED":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h1 className="mb-8">My Profile</h1>

        {/* Profile Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role === "admin" ? "Admin" : "Customer"}
              </Badge>
              <p className="text-sm text-muted-foreground">Account Role</p>
            </div>

            <Separator />

            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
            <CardDescription>
              {orders.length > 0
                ? `You have ${orders.length} order${orders.length !== 1 ? "s" : ""}`
                : "No orders yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
                <Button onClick={() => navigate("/")}>Start Shopping</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">Order #{order.orderCode}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(order.createdAt, "MMM dd, yyyy")}
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-sm">
                            <p className="font-medium">
                              {item.productName}
                              {item.variationName && ` - ${item.variationName}`}
                            </p>
                            <p className="text-muted-foreground">
                              Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-3" />

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Items</span>
                        <span className="font-medium">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
