import { useState } from "react";
import { Link } from "react-router";
import { MessageCircle, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useCart } from "../lib/cartStore";
import { toast } from "sonner";

export function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCart();
  const totalPrice = getTotalPrice();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    company: "",
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

  const handleWhatsAppOrder = () => {
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Build WhatsApp message
    let message = `*NEW ORDER REQUEST*\n\n`;
    message += `*Customer Details:*\n`;
    message += `Name: ${formData.fullName}\n`;
    message += `Phone: ${formData.phone}\n`;
    if (formData.email) message += `Email: ${formData.email}\n`;
    if (formData.company) message += `Company: ${formData.company}\n`;
    message += `City: ${formData.city}\n`;
    message += `Address: ${formData.address}\n`;
    if (formData.gstNumber) message += `GST Number: ${formData.gstNumber}\n`;
    
    message += `\n*Order Items:*\n`;
    items.forEach((item, index) => {
      message += `\n${index + 1}. ${item.product.name}\n`;
      message += `   Qty: ${item.quantity}\n`;
      if (item.product.price) {
        message += `   Price: $${item.product.price} each\n`;
        message += `   Subtotal: $${(item.product.price * item.quantity).toLocaleString()}\n`;
      } else {
        message += `   Price: Quote Required\n`;
      }
    });
    
    if (totalPrice > 0) {
      message += `\n*Total Amount: $${totalPrice.toLocaleString()}*\n`;
    } else {
      message += `\n*Total: Quote Required*\n`;
    }
    
    if (formData.notes) {
      message += `\n*Additional Notes:*\n${formData.notes}`;
    }

    // Open WhatsApp
    window.open(
      `https://wa.me/1234567890?text=${encodeURIComponent(message)}`,
      "_blank"
    );

    // Clear cart and show success
    clearCart();
    toast.success("Order sent via WhatsApp!");
    
    // Reset form
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      company: "",
      city: "",
      address: "",
      gstNumber: "",
      notes: "",
    });
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

                {/* Phone & Email */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Company */}
                <div>
                  <Label htmlFor="company">Company Name (Optional)</Label>
                  <Input
                    id="company"
                    name="company"
                    placeholder="Your Company Ltd."
                    value={formData.company}
                    onChange={handleChange}
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
                    placeholder="New York"
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
                  <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                  <Input
                    id="gstNumber"
                    name="gstNumber"
                    placeholder="XX XXXXX XXXXX XXX"
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
                          ${(item.product.price * item.quantity).toLocaleString()}
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
                      <span className="font-medium">${totalPrice.toLocaleString()}</span>
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
                    <span className="text-xl font-bold">${totalPrice.toLocaleString()}</span>
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
              >
                <MessageCircle className="h-5 w-5" />
                Send Order on WhatsApp
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
