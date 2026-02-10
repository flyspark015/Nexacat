import { Link } from "react-router";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { MessageCircle, ExternalLink } from "lucide-react";

// Mock orders data
const mockOrders = [
  {
    id: "ORD-001",
    customerName: "John Smith",
    phone: "+1 234 567 8900",
    email: "john@company.com",
    company: "Tech Solutions Inc.",
    items: 3,
    total: 5124.99,
    status: "pending",
    date: "2026-02-10",
  },
  {
    id: "ORD-002",
    customerName: "Sarah Johnson",
    phone: "+1 234 567 8901",
    email: "sarah@corp.com",
    company: "Innovation Corp",
    items: 1,
    total: null,
    status: "quote",
    date: "2026-02-09",
  },
  {
    id: "ORD-003",
    customerName: "Mike Chen",
    phone: "+1 234 567 8902",
    email: "mike@startup.io",
    company: "Startup Inc",
    items: 5,
    total: 12450.50,
    status: "completed",
    date: "2026-02-08",
  },
];

export function AdminOrders() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/10 text-warning border-warning";
      case "quote":
        return "bg-blue-accent/10 text-blue-accent border-blue-accent";
      case "completed":
        return "bg-success/10 text-success border-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Orders & Enquiries</h1>
            <p className="mt-2 text-muted-foreground">
              View and manage customer orders from WhatsApp
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Orders Table */}
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-semibold">Order ID</th>
                  <th className="p-4 text-left font-semibold">Customer</th>
                  <th className="p-4 text-left font-semibold">Contact</th>
                  <th className="p-4 text-left font-semibold">Items</th>
                  <th className="p-4 text-left font-semibold">Total</th>
                  <th className="p-4 text-left font-semibold">Status</th>
                  <th className="p-4 text-left font-semibold">Date</th>
                  <th className="p-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-4">
                      <span className="font-mono font-medium">{order.id}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.company}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p>{order.phone}</p>
                        <p className="text-muted-foreground">{order.email}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{order.items} items</td>
                    <td className="p-4 text-sm font-medium">
                      {order.total ? (
                        `$${order.total.toLocaleString()}`
                      ) : (
                        <span className="text-blue-accent">Quote Required</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{order.date}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() =>
                            window.open(
                              `https://wa.me/${order.phone.replace(/\D/g, "")}`,
                              "_blank"
                            )
                          }
                        >
                          <MessageCircle className="h-4 w-4" />
                          Contact
                        </Button>
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-xl border bg-blue-accent/5 p-6">
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-1 h-5 w-5 text-blue-accent" />
            <div>
              <h3 className="font-semibold">WhatsApp Integration</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Orders are received via WhatsApp. This demo shows how orders would appear.
                In production, you would integrate with WhatsApp Business API or use a
                third-party service to track orders.
              </p>
            </div>
          </div>
        </div>

        {/* Back Navigation */}
        <div className="mt-8 flex gap-4">
          <Button variant="outline" asChild>
            <Link to="/admin">← Back to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">View Store</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
