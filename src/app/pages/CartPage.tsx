import { Link } from "react-router";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { useCart } from "../lib/cartStore";

export function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCart();
  const totalPrice = getTotalPrice();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
            <div className="mb-4 text-6xl">🛒</div>
            <h2 className="mb-2 text-2xl font-bold">Your cart is empty</h2>
            <p className="mb-6 text-muted-foreground">
              Add products to your cart to get started
            </p>
            <Button asChild className="gap-2">
              <Link to="/">
                <ShoppingBag className="h-4 w-4" />
                Browse Products
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasOnlyQuoteItems = items.every((item) => !item.product.price);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Shopping Cart</h1>
          <p className="mt-2 text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""} in your cart
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  {/* Product Image */}
                  <Link
                    to={`/product/${item.product.slug}`}
                    className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-32 sm:w-32"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link
                        to={`/product/${item.product.slug}`}
                        className="mb-1 font-semibold hover:text-blue-accent"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {item.product.brand} • {item.product.categoryName}
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                      {/* Quantity */}
                      <div className="flex items-center rounded-lg border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Price & Remove */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {item.product.price ? (
                            <>
                              <p className="text-lg font-bold">
                                ${(item.product.price * item.quantity).toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${item.product.price.toLocaleString()} each
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-medium text-blue-accent">
                              Quote Required
                            </p>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl border bg-card p-6">
              <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>

              <div className="space-y-3 border-b pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  {hasOnlyQuoteItems ? (
                    <span className="font-medium text-blue-accent">Quote Required</span>
                  ) : (
                    <span className="font-medium">${totalPrice.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between border-b pb-4">
                <span className="font-semibold">Total</span>
                {hasOnlyQuoteItems ? (
                  <span className="font-semibold text-blue-accent">Quote Required</span>
                ) : (
                  <span className="text-xl font-bold">${totalPrice.toLocaleString()}</span>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <Button asChild className="w-full gap-2 bg-blue-accent hover:bg-blue-accent/90">
                  <Link to="/checkout">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/">Continue Shopping</Link>
                </Button>
              </div>

              {hasOnlyQuoteItems && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Some items require a quote. You'll be able to request pricing during
                  checkout.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
