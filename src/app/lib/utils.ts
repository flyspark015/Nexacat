/**
 * Utility functions for FlySpark Catalog
 */

/**
 * Generate a unique order code
 * Format: ORD-YYYY-XXXXX (e.g., ORD-2026-12345)
 */
export function generateOrderCode(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  return `ORD-${year}-${randomNum}`;
}

/**
 * Format price to Indian Rupee format
 */
export function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

/**
 * Generate slug from string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Format WhatsApp message for order
 */
export function generateWhatsAppOrderMessage(order: {
  orderCode: string;
  customerName: string;
  items: Array<{
    productName: string;
    variationName?: string;
    quantity: number;
    price: number;
  }>;
  phone: string;
  city: string;
  address: string;
  gstin?: string;
  note?: string;
}): string {
  const itemsList = order.items
    .map((item) => {
      const variation = item.variationName ? ` (${item.variationName})` : "";
      return `• ${item.productName}${variation} x ${item.quantity} - ${formatPrice(
        item.price * item.quantity
      )}`;
    })
    .join("\n");

  const total = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  let message = `Hello! I've placed an order on FlySpark.\n\n`;
  message += `📦 Order ID: #${order.orderCode}\n`;
  message += `👤 Customer: ${order.customerName}\n\n`;
  message += `📋 Items:\n${itemsList}\n\n`;
  message += `💰 Total: ${formatPrice(total)}\n\n`;
  message += `📍 Delivery Details:\n`;
  message += `City: ${order.city}\n`;
  message += `Address: ${order.address}\n`;
  if (order.gstin) {
    message += `GSTIN: ${order.gstin}\n`;
  }
  if (order.note) {
    message += `\n📝 Note: ${order.note}\n`;
  }
  message += `\nPlease confirm my order. Thank you!`;

  return message;
}

/**
 * Get WhatsApp link with pre-filled message
 */
export function getWhatsAppLink(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  // Remove any non-digit characters from phone
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

/**
 * Get order status badge color
 */
export function getOrderStatusColor(
  status: "NEW" | "CONTACTED" | "QUOTED" | "CLOSED"
): string {
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
}

/**
 * Get stock status badge color and text
 */
export function getStockStatusBadge(status: "in-stock" | "out-of-stock" | "preorder"): {
  text: string;
  className: string;
} {
  switch (status) {
    case "in-stock":
      return {
        text: "In Stock",
        className: "bg-success/10 text-success border-success/20",
      };
    case "out-of-stock":
      return {
        text: "Out of Stock",
        className: "bg-destructive/10 text-destructive border-destructive/20",
      };
    case "preorder":
      return {
        text: "Pre-order",
        className: "bg-blue-accent/10 text-blue-accent border-blue-accent/20",
      };
    default:
      return {
        text: "In Stock",
        className: "bg-success/10 text-success border-success/20",
      };
  }
}

/**
 * Generate WhatsApp share message for product
 */
export function generateWhatsAppProductMessage(product: {
  name: string;
  price?: number;
  productUrl: string;
}): string {
  let message = `Check out this product on FlySpark:\n\n`;
  message += `📦 ${product.name}\n`;
  if (product.price) {
    message += `💰 Price: ${formatPrice(product.price)}\n`;
  }
  message += `\n🔗 ${product.productUrl}`;
  return message;
}

/**
 * Extract YouTube video ID from URL
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}