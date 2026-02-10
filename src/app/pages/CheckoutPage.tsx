import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { MessageCircle, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useCart } from "../lib/cartStore";
import { useAuthStore } from "../lib/authStore";
import { createOrder } from "../lib/firestoreService";
import { generateOrderCode, generateWhatsAppOrderMessage, getWhatsAppLink } from "../lib/utils";
import { toast } from "sonner";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuthStore();
  const totalPrice = getTotalPrice();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: "",
    city: "",
    address: "",
    gstNumber: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleWhatsAppOrder = async () => {
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isAuthenticated() || !user) {
      toast.error("Please login to place an order");
      navigate("/login");
      return;
    }

    setSubmitting(true);

    try {
      // Generate order code
      const orderCode = generateOrderCode();

      // Prepare order items
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price || 0,
        quantity: item.quantity,
        sku: item.product.sku,
      }));

      // Create order in Firestore
      const orderId = await createOrder({
        orderCode,
        customerUid: user.uid,
        customerName: formData.fullName,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        gstin: formData.gstNumber || undefined,
        note: formData.notes || undefined,
        items: orderItems,
        status: "NEW",
      });

      // Generate WhatsApp message
      const whatsappMessage = generateWhatsAppOrderMessage({
        orderCode,
        customerName: formData.fullName,
        items: orderItems,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        gstin: formData.gstNumber,
        note: formData.notes,
      });

      // Open WhatsApp (use your business WhatsApp number)
      const whatsappLink = getWhatsAppLink("1234567890", whatsappMessage);
      window.open(whatsappLink, "_blank");

      // Clear cart and show success
      clearCart();
      toast.success(`Order #${orderCode} created successfully!`);

      // Navigate to profile/orders
      navigate("/profile");
    } catch (error: any) {
      console.error("Order creation failed:", error);
      toast.error("Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
            <div className="mb-4 text-6xl">🛒</div>
            <h2 className="mb-2 text-2xl font-bold">Your cart is empty</h2>
            <p className="mb-6 text-muted-foreground">
              Add products to your cart before checking out
            </p>
            <Button asChild>
              <Link to="/">Browse Products</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Checkout</h1>
          <p className="mt-2 text-muted-foreground">
            Complete your order via WhatsApp
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-6 text-xl font-semibold">Customer Information</h2>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* City */}
                <div>
                  <Label htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Mumbai"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address">
                    Delivery Address <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Street address, building, floor, etc."
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* GST Number */}
                <div>
                  <Label htmlFor="gstNumber">GSTIN (Optional)</Label>
                  <Input
                    id="gstNumber"
                    name="gstNumber"
                    placeholder="22AAAAA0000A1Z5"
                    value={formData.gstNumber}
                    onChange={handleChange}
                  />
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any special requirements or instructions..."
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              <div className="rounded-xl border bg-card p-6">
                <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>

                {/* Items */}
                <div className="space-y-3 border-b pb-4">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      {item.product.price ? (
                        <p className="font-medium">
                          ₹{(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-blue-accent">Quote</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 border-b py-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    {totalPrice > 0 ? (
                      <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
                    ) : (
                      <span className="text-sm font-medium text-blue-accent">Quote</span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">TBD</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between">
                  <span className="font-semibold">Total</span>
                  {totalPrice > 0 ? (
                    <span className="text-xl font-bold">₹{totalPrice.toLocaleString()}</span>
                  ) : (
                    <span className="font-semibold text-blue-accent">Quote Required</span>
                  )}
                </div>
              </div>

              {/* WhatsApp Button */}
              <Button
                size="lg"
                className="w-full gap-2 bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleWhatsAppOrder}
                disabled={submitting}
              >
                <MessageCircle className="h-5 w-5" />
                {submitting ? "Creating Order..." : "Send Order on WhatsApp"}
              </Button>

              <div className="rounded-xl border bg-muted/50 p-4">
                <div className="mb-3 flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <div>
                    <p className="font-medium">Secure WhatsApp Checkout</p>
                    <p className="text-sm text-muted-foreground">
                      Your order details will be sent via WhatsApp for confirmation
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <div>
                    <p className="font-medium">Direct Communication</p>
                    <p className="text-sm text-muted-foreground">
                      Get instant support and order tracking
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}